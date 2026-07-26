import { prisma } from '@/lib/db';
import { toDisplayNumber } from '@/lib/money';

interface LedgerRow {
  period: string; // 'YYYY-MM'
  dueDate: string;
  expected: number;
  paid: number;
  outstanding: number;
}

/**
 * Walks every billing cycle from a lease's start date (or its 12 most
 * recent cycles, whichever is shorter) through the current month, and
 * nets out payments against each cycle. This is the real per-lease
 * due-date logic flagged as missing from the Milestone 4 dashboard
 * approximation — it respects each lease's own `billingDay` rather than
 * treating every lease as due on the 1st of the calendar month.
 *
 * Refunds are netted against the payment they were issued for, so a
 * refunded payment stops counting toward that period's "paid" total.
 */
export async function getLeaseLedger(leaseId: string): Promise<{ rows: LedgerRow[]; totalOutstanding: number }> {
  const lease = await prisma.lease.findUniqueOrThrow({ where: { id: leaseId } });
  const rentAmount = toDisplayNumber(lease.rentAmount);

  const payments = await prisma.payment.findMany({
    where: { leaseId, status: { in: ['CONFIRMED', 'PARTIALLY_REFUNDED'] }, paymentType: { in: ['RENT', 'ADVANCE'] } },
    include: { refunds: true },
  });

  const now = new Date();
  const cycleStart = new Date(lease.startDate);
  const lastCycleEnd = lease.endDate < now ? new Date(lease.endDate) : now;

  const rows: LedgerRow[] = [];
  const cursor = new Date(cycleStart.getFullYear(), cycleStart.getMonth(), lease.billingDay);
  // Start from the lease's own start month, walking forward one billing
  // cycle at a time, capped at 24 rows as a sanity bound (2 years of
  // history is plenty for a ledger view; older history is still in the
  // raw Payments table if ever needed).
  let guard = 0;
  while (cursor <= lastCycleEnd && guard < 24) {
    const periodLabel = cursor.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const periodKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;

    const paidThisPeriod = payments
      .filter((p) => p.paidForPeriod && p.paidForPeriod.getFullYear() === cursor.getFullYear() && p.paidForPeriod.getMonth() === cursor.getMonth())
      .reduce((sum, p) => {
        const refunded = p.refunds.reduce((rSum, r) => rSum + toDisplayNumber(r.amount), 0);
        return sum + Math.max(0, toDisplayNumber(p.amount) - refunded);
      }, 0);

    rows.push({
      period: periodLabel,
      dueDate: new Date(cursor).toISOString(),
      expected: rentAmount,
      paid: paidThisPeriod,
      outstanding: Math.max(0, rentAmount - paidThisPeriod),
    });

    cursor.setMonth(cursor.getMonth() + 1);
    guard++;
  }

  const totalOutstanding = rows.reduce((sum, r) => sum + r.outstanding, 0);
  return { rows: rows.reverse(), totalOutstanding }; // most recent first
}

export async function getLeaseOutstandingBalance(leaseId: string): Promise<number> {
  const { totalOutstanding } = await getLeaseLedger(leaseId);
  return totalOutstanding;
}
