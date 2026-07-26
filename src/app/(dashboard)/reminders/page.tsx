import { getCurrentUser } from '@/lib/auth/session';
import { listReminderLog, listReminderTemplates } from '@/server/services/reminders';
import { RunCheckButton } from '@/components/reminders/run-check-button';
import { TemplateEditor } from '@/components/reminders/template-editor';

const TRIGGER_LABELS: Record<string, string> = {
  DAYS_BEFORE_7: '7 days before',
  DAYS_BEFORE_3: '3 days before',
  DUE_TODAY: 'Due today',
  OVERDUE_3: '3 days overdue',
  OVERDUE_7: '7 days overdue',
  OVERDUE_14: '14 days overdue',
  OVERDUE_30: '30 days overdue',
};

const STATUS_COLORS: Record<string, string> = {
  SENT: 'bg-forest-50 text-forest',
  DELIVERED: 'bg-forest-50 text-forest',
  PENDING: 'bg-ochre/10 text-ochre',
  FAILED: 'bg-red-50 text-red-700',
};

export default async function RemindersPage() {
  const [session, log, templates] = await Promise.all([
    getCurrentUser(),
    listReminderLog(),
    listReminderTemplates(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink mb-1">Reminders</h1>
        <p className="text-ink/60 text-sm">
          Runs automatically once a day via the scheduled <code className="font-mono text-xs">/api/cron/reminders</code> endpoint.
        </p>
      </div>

      {session?.role === 'LANDLORD' && <RunCheckButton />}

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink mb-3">Delivery log</h2>
          {log.length === 0 ? (
            <p className="text-sm text-ink/50">No reminders sent yet.</p>
          ) : (
            <div className="bg-white border border-rule rounded-lg divide-y divide-rule">
              {log.map((r) => (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{r.tenantName}</p>
                    <p className="text-xs text-ink/50">
                      Unit {r.unitNumber} · {TRIGGER_LABELS[r.triggerType]} · {r.channel.toLowerCase()}
                    </p>
                  </div>
                  <span className={`text-xs font-mono uppercase px-2 py-1 rounded ${STATUS_COLORS[r.status] ?? ''}`}>
                    {r.status.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-ink mb-3">Message templates</h2>
          <div className="space-y-3">
            {templates.map((t) => (
              <TemplateEditor key={t.id} template={t} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
