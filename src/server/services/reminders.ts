import { prisma } from '@/lib/db';
import { formatUgx, toDisplayNumber } from '@/lib/money';
import { sendEmail } from '@/lib/notifications/email';
import { sendSms } from '@/lib/notifications/sms';
import { sendWhatsApp } from '@/lib/notifications/whatsapp';

const TRIGGER_OFFSETS: Record<string, number> = {
  DAYS_BEFORE_7: -7,
  DAYS_BEFORE_3: -3,
  DUE_TODAY: 0,
  OVERDUE_3: 3,
  OVERDUE_7: 7,
  OVERDUE_14: 14,
  OVERDUE_30: 30,
};

const OVERDUE_LABELS: Record<string, string> = {
  OVERDUE_3: '3 days overdue',
  OVERDUE_7: '7 days overdue',
  OVERDUE_14: '14 days overdue',
  OVERDUE_30: '30 days overdue',
};

function sameCalendarDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fillTemplate(body: string, vars: Record<string, string>) {
  return body.replace(/{{\s*(\w+)\s*}}/g, (_, key) => vars[key] ?? '');
}

/**
 * The core reminder check. For every active lease, and every trigger type
 * (7/3 days before, due today, 3/7/14/30 days overdue), works out whether
 * *today* is that trigger's date relative to one of the lease's nearby
 * billing-cycle due dates (previous/current/next month, which together
 * cover every offset from -7 to +30 days). If it is, and no reminder has
 * already been sent for that exact (lease, trigger, channel, billing
 * period) combination — enforced by a DB unique constraint, not just this
 * check — it sends one via every active template for that trigger.
 *
 * Designed to be safe to call repeatedly (e.g. an external cron hitting
 * `/api/cron/reminders` daily, or a manual "run now" from the UI): already
 * sent reminders are always skipped, never duplicated.
 */
export async function runReminderCheck(): Promise<{ checked: number; sent: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeLeases = await prisma.lease.findMany({
    where: { status: 'ACTIVE' },
    include: {
      tenant: { select: { fullName: true, phone: true, email: true } },
      unit: { select: { unitNumber: true, property: { select: { name: true } } } },
    },
  });

  const templates = await prisma.reminderTemplate.findMany({ where: { isActive: true } });
  let sentCount = 0;
  const overdueAlerts: { tenantName: string; unitLabel: string; triggerType: string; amount: string }[] = [];
  const seenOverdueThisRun = new Set<string>();

  for (const lease of activeLeases) {
    const nearbyDueDates = [-1, 0, 1].map(
      (monthOffset) => new Date(today.getFullYear(), today.getMonth() + monthOffset, lease.billingDay)
    );

    for (const dueDate of nearbyDueDates) {
      const billingPeriod = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);

      for (const [triggerType, offsetDays] of Object.entries(TRIGGER_OFFSETS)) {
        const targetDate = new Date(dueDate);
        targetDate.setDate(targetDate.getDate() + offsetDays);
        if (!sameCalendarDay(targetDate, today)) continue;

        if (triggerType in OVERDUE_LABELS) {
          const dedupeKey = `${lease.id}-${triggerType}`;
          if (!seenOverdueThisRun.has(dedupeKey)) {
            seenOverdueThisRun.add(dedupeKey);
            overdueAlerts.push({
              tenantName: lease.tenant.fullName,
              unitLabel: `${lease.unit.property.name} · ${lease.unit.unitNumber}`,
              triggerType,
              amount: formatUgx(toDisplayNumber(lease.rentAmount)),
            });
          }
        }

        const matchingTemplates = templates.filter((t) => t.triggerType === triggerType);
        for (const template of matchingTemplates) {
          const vars = {
            tenant_name: lease.tenant.fullName,
            amount: formatUgx(toDisplayNumber(lease.rentAmount)),
            due_date: dueDate.toLocaleDateString('en-GB'),
            unit: `${lease.unit.property.name} · ${lease.unit.unitNumber}`,
          };
          const message = fillTemplate(template.messageBody, vars);

          try {
            // The unique constraint on (lease_id, trigger_type, channel,
            // billing_period) is what actually prevents a duplicate send if
            // this function is ever called twice for the same day — this
            // create is the dedupe check, not just a log entry.
            const reminder = await prisma.reminder.create({
              data: {
                leaseId: lease.id,
                templateId: template.id,
                triggerType: triggerType as never,
                channel: template.channel,
                billingPeriod,
                status: 'PENDING',
              },
            });

            if (template.channel === 'SMS') await sendSms({ to: lease.tenant.phone, body: message });
            else if (template.channel === 'WHATSAPP') await sendWhatsApp({ to: lease.tenant.phone, body: message });
            else if (template.channel === 'EMAIL' && lease.tenant.email) {
              await sendEmail({ to: lease.tenant.email, subject: 'Rent reminder', body: message });
            }

            await prisma.reminder.update({ where: { id: reminder.id }, data: { status: 'SENT', sentAt: new Date() } });
            sentCount++;
          } catch {
            // P2002 (unique constraint) means this exact reminder already
            // went out this cycle — expected and fine, just skip it.
            continue;
          }
        }
      }
    }
  }

  if (overdueAlerts.length > 0) {
    await sendLandlordOverdueAlert(overdueAlerts);
  }

  return { checked: activeLeases.length, sent: sentCount };
}

/**
 * One email per run (not one per tenant) — a landlord managing several
 * properties wants a single "here's who's behind" digest, not a flood of
 * separate emails every time the daily check finds more than one overdue
 * tenant.
 */
async function sendLandlordOverdueAlert(
  alerts: { tenantName: string; unitLabel: string; triggerType: string; amount: string }[]
) {
  const landlords = await prisma.user.findMany({ where: { role: 'LANDLORD', status: 'ACTIVE' }, select: { email: true } });
  if (landlords.length === 0) return;

  const lines = alerts.map(
    (a) => `- ${a.tenantName} (${a.unitLabel}): ${OVERDUE_LABELS[a.triggerType]}, ${a.amount} due`
  );
  const body = [
    `${alerts.length} tenant${alerts.length === 1 ? ' is' : 's are'} now overdue on rent:`,
    '',
    ...lines,
    '',
    'Log in to RentLedger to see full details or record a payment.',
  ].join('\n');

  for (const landlord of landlords) {
    await sendEmail({ to: landlord.email, subject: `RentLedger: ${alerts.length} tenant${alerts.length === 1 ? '' : 's'} overdue on rent`, body });
  }
}

export async function listReminderLog(limit = 50) {
  const reminders = await prisma.reminder.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      lease: {
        include: { tenant: { select: { fullName: true } }, unit: { select: { unitNumber: true } } },
      },
    },
  });
  return reminders.map((r) => ({
    id: r.id,
    tenantName: r.lease.tenant.fullName,
    unitNumber: r.lease.unit.unitNumber,
    triggerType: r.triggerType,
    channel: r.channel,
    status: r.status,
    sentAt: r.sentAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function listReminderTemplates() {
  return prisma.reminderTemplate.findMany({ orderBy: [{ triggerType: 'asc' }, { channel: 'asc' }] });
}

export async function updateReminderTemplate(id: string, messageBody: string, isActive: boolean) {
  return prisma.reminderTemplate.update({ where: { id }, data: { messageBody, isActive } });
}
