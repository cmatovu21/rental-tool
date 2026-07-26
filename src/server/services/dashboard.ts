import { prisma } from '@/lib/db';
import { toDisplayNumber } from '@/lib/money';

/**
 * Occupancy note: `units.status` is a stored column, but per the Milestone 1/2
 * design decision, OCCUPIED/VACANT should be *derived* from whether a unit has
 * an active lease — not trusted as an independent source of truth, since the
 * two could drift out of sync. The one thing `units.status` still governs
 * directly is MAINTENANCE (there's no lease-based signal for that). This
 * function is the one place that reconciles the two; Milestone 5 (Property
 * Module) should keep `units.status` in sync automatically so this and the
 * raw column agree.
 */
async function getUnitsWithDerivedStatus() {
  const units = await prisma.unit.findMany({
    include: {
      property: { select: { name: true } },
      leases: { where: { status: 'ACTIVE' }, take: 1 },
    },
  });
  return units.map((unit) => {
    const derivedStatus: 'OCCUPIED' | 'VACANT' | 'MAINTENANCE' =
      unit.leases.length > 0 ? 'OCCUPIED' : unit.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'VACANT';
    return { ...unit, derivedStatus };
  });
}

export async function getOccupancySummary() {
  const units = await getUnitsWithDerivedStatus();
  const total = units.length;
  const occupied = units.filter((u) => u.derivedStatus === 'OCCUPIED').length;
  const vacant = units.filter((u) => u.derivedStatus === 'VACANT').length;
  const maintenance = units.filter((u) => u.derivedStatus === 'MAINTENANCE').length;
  return {
    total,
    occupied,
    vacant,
    maintenance,
    occupancyRate: total === 0 ? 0 : Math.round((occupied / total) * 100),
  };
}

export async function getVacantUnits() {
  const units = await getUnitsWithDerivedStatus();
  return units
    .filter((u) => u.derivedStatus === 'VACANT')
    .map((u) => ({
      id: u.id,
      unitNumber: u.unitNumber,
      propertyName: u.property.name,
      rentAmount: toDisplayNumber(u.rentAmount),
      bedrooms: u.bedrooms,
    }));
}

/**
 * "Expected" is the sum of rent across all currently-active leases.
 * "Collected" is rent/advance payments recorded against the current
 * calendar month. This is a calendar-month approximation for the
 * dashboard — real due-date tracking per lease (respecting each lease's
 * billingDay) is scoped to the Payment Module (Milestone 7).
 */
export async function getFinancialSummary() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const activeLeases = await prisma.lease.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, rentAmount: true },
  });
  const expected = activeLeases.reduce((sum, l) => sum + toDisplayNumber(l.rentAmount), 0);

  const paymentsThisMonth = await prisma.payment.groupBy({
    by: ['leaseId'],
    where: {
      status: 'CONFIRMED',
      paymentType: { in: ['RENT', 'ADVANCE'] },
      paidForPeriod: { gte: monthStart, lt: monthEnd },
    },
    _sum: { amount: true },
  });
  const collectedByLease = new Map(paymentsThisMonth.map((p) => [p.leaseId, toDisplayNumber(p._sum.amount)]));
  const collected = paymentsThisMonth.reduce((sum, p) => sum + toDisplayNumber(p._sum.amount), 0);

  // Outstanding is summed per lease (never let one lease's overpayment mask
  // another lease's shortfall the way a single expected-minus-collected
  // subtraction across the whole portfolio would).
  const outstanding = activeLeases.reduce((sum, l) => {
    const owed = toDisplayNumber(l.rentAmount) - (collectedByLease.get(l.id) ?? 0);
    return sum + Math.max(0, owed);
  }, 0);

  return { expected, collected, outstanding, monthLabel: monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric' }) };
}

export async function getMaintenanceSummary() {
  const counts = await prisma.maintenanceTicket.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const openCount =
    (byStatus.OPEN ?? 0) + (byStatus.IN_PROGRESS ?? 0) + (byStatus.AWAITING_APPROVAL ?? 0);

  const pendingExpenses = await prisma.maintenanceExpense.aggregate({
    where: { status: 'PENDING' },
    _sum: { amount: true },
    _count: { _all: true },
  });

  return {
    open: byStatus.OPEN ?? 0,
    inProgress: byStatus.IN_PROGRESS ?? 0,
    awaitingApproval: byStatus.AWAITING_APPROVAL ?? 0,
    completed: byStatus.COMPLETED ?? 0,
    closed: byStatus.CLOSED ?? 0,
    totalOpenIssues: openCount,
    pendingExpenseTotal: toDisplayNumber(pendingExpenses._sum.amount),
    pendingExpenseCount: pendingExpenses._count._all,
  };
}

export async function getRecentPayments(limit = 5) {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      lease: {
        include: {
          tenant: { select: { fullName: true } },
          unit: { select: { unitNumber: true, property: { select: { name: true } } } },
        },
      },
    },
  });
  return payments.map((p) => ({
    id: p.id,
    amount: toDisplayNumber(p.amount),
    method: p.method,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    tenantName: p.lease.tenant.fullName,
    unitLabel: `${p.lease.unit.property.name} · ${p.lease.unit.unitNumber}`,
  }));
}

export async function getUpcomingLeaseExpiries(withinDays = 60) {
  const now = new Date();
  const horizon = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
  const leases = await prisma.lease.findMany({
    where: { status: 'ACTIVE', endDate: { gte: now, lte: horizon } },
    orderBy: { endDate: 'asc' },
    include: {
      tenant: { select: { fullName: true } },
      unit: { select: { unitNumber: true, property: { select: { name: true } } } },
    },
  });
  return leases.map((l) => ({
    id: l.id,
    tenantName: l.tenant.fullName,
    unitLabel: `${l.unit.property.name} · ${l.unit.unitNumber}`,
    endDate: l.endDate.toISOString(),
    daysRemaining: Math.ceil((l.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
  }));
}

/** Collected rent per month for the last N months (by payment date, not paidForPeriod). */
export async function getRevenueTrend(months = 6) {
  const now = new Date();
  const buckets: { label: string; start: Date; end: Date }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    buckets.push({ label: start.toLocaleString('en-US', { month: 'short' }), start, end });
  }

  const earliestStart = buckets[0].start;
  const payments = await prisma.payment.findMany({
    where: { status: 'CONFIRMED', createdAt: { gte: earliestStart } },
    select: { amount: true, createdAt: true },
  });

  return buckets.map((bucket) => {
    const total = payments
      .filter((p) => p.createdAt >= bucket.start && p.createdAt < bucket.end)
      .reduce((sum, p) => sum + toDisplayNumber(p.amount), 0);
    return { month: bucket.label, collected: total };
  });
}
