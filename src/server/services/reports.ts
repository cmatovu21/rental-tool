import { prisma } from '@/lib/db';
import { toDisplayNumber } from '@/lib/money';
import { getLeaseLedger } from '@/server/services/ledger';
import { getOccupancySummary } from '@/server/services/dashboard';

export interface TabularReport {
  title: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string | number>[];
}

export const REPORT_TYPES = [
  'rent-roll',
  'cash-flow',
  'income-statement',
  'occupancy',
  'maintenance-costs',
  'outstanding-rent',
  'late-tenants',
  'revenue-trends',
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

async function rentRoll(): Promise<TabularReport> {
  const leases = await prisma.lease.findMany({
    where: { status: 'ACTIVE' },
    include: { tenant: { select: { fullName: true } }, unit: { select: { unitNumber: true, property: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  return {
    title: 'Rent Roll',
    columns: [
      { key: 'tenant', label: 'Tenant' },
      { key: 'unit', label: 'Unit' },
      { key: 'rent', label: 'Monthly Rent (UGX)' },
      { key: 'billingDay', label: 'Billing Day' },
      { key: 'startDate', label: 'Lease Start' },
      { key: 'endDate', label: 'Lease End' },
    ],
    rows: leases.map((l) => ({
      tenant: l.tenant.fullName,
      unit: `${l.unit.property.name} · ${l.unit.unitNumber}`,
      rent: toDisplayNumber(l.rentAmount),
      billingDay: l.billingDay,
      startDate: l.startDate.toISOString().slice(0, 10),
      endDate: l.endDate.toISOString().slice(0, 10),
    })),
  };
}

async function cashFlow(months = 6): Promise<TabularReport> {
  const now = new Date();
  const rows: Record<string, string | number>[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const [income, refunds, expenses] = await Promise.all([
      prisma.payment.aggregate({ where: { status: { in: ['CONFIRMED', 'PARTIALLY_REFUNDED'] }, createdAt: { gte: start, lt: end } }, _sum: { amount: true } }),
      prisma.refund.aggregate({ where: { createdAt: { gte: start, lt: end } }, _sum: { amount: true } }),
      prisma.maintenanceExpense.aggregate({ where: { status: 'APPROVED', approvedAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    ]);
    const cashIn = toDisplayNumber(income._sum.amount) - toDisplayNumber(refunds._sum.amount);
    const cashOut = toDisplayNumber(expenses._sum.amount);
    rows.push({
      month: start.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      cashIn,
      cashOut,
      net: cashIn - cashOut,
    });
  }
  return {
    title: 'Cash Flow',
    columns: [
      { key: 'month', label: 'Month' },
      { key: 'cashIn', label: 'Cash In (UGX)' },
      { key: 'cashOut', label: 'Cash Out (UGX)' },
      { key: 'net', label: 'Net (UGX)' },
    ],
    rows,
  };
}

async function incomeStatement(): Promise<TabularReport> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [income, refunds, expenses] = await Promise.all([
    prisma.payment.aggregate({ where: { status: { in: ['CONFIRMED', 'PARTIALLY_REFUNDED'] }, createdAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    prisma.refund.aggregate({ where: { createdAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    prisma.maintenanceExpense.aggregate({ where: { status: 'APPROVED', approvedAt: { gte: start, lt: end } }, _sum: { amount: true } }),
  ]);
  const grossIncome = toDisplayNumber(income._sum.amount);
  const refundTotal = toDisplayNumber(refunds._sum.amount);
  const netIncome = grossIncome - refundTotal;
  const expenseTotal = toDisplayNumber(expenses._sum.amount);
  return {
    title: `Income Statement — ${start.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
    columns: [
      { key: 'line', label: 'Line item' },
      { key: 'amount', label: 'Amount (UGX)' },
    ],
    rows: [
      { line: 'Gross rent collected', amount: grossIncome },
      { line: 'Refunds issued', amount: -refundTotal },
      { line: 'Net rent income', amount: netIncome },
      { line: 'Maintenance expenses (approved)', amount: -expenseTotal },
      { line: 'Net operating income', amount: netIncome - expenseTotal },
    ],
  };
}

async function occupancy(): Promise<TabularReport> {
  const properties = await prisma.property.findMany({
    include: { units: { include: { leases: { where: { status: 'ACTIVE' }, take: 1 } } } },
  });
  const rows = properties.map((p) => {
    const total = p.units.length;
    const occupied = p.units.filter((u) => u.leases.length > 0).length;
    return {
      property: p.name,
      totalUnits: total,
      occupied,
      vacant: total - occupied,
      occupancyRate: total === 0 ? 0 : Math.round((occupied / total) * 100),
    };
  });
  return {
    title: 'Occupancy by Property',
    columns: [
      { key: 'property', label: 'Property' },
      { key: 'totalUnits', label: 'Total Units' },
      { key: 'occupied', label: 'Occupied' },
      { key: 'vacant', label: 'Vacant' },
      { key: 'occupancyRate', label: 'Occupancy Rate (%)' },
    ],
    rows,
  };
}

async function maintenanceCosts(months = 6): Promise<TabularReport> {
  const now = new Date();
  const rows: Record<string, string | number>[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const approved = await prisma.maintenanceExpense.aggregate({
      where: { status: 'APPROVED', approvedAt: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: { _all: true },
    });
    rows.push({
      month: start.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      approvedExpenses: approved._count._all,
      total: toDisplayNumber(approved._sum.amount),
    });
  }
  return {
    title: 'Maintenance Costs',
    columns: [
      { key: 'month', label: 'Month' },
      { key: 'approvedExpenses', label: 'Approved Expenses' },
      { key: 'total', label: 'Total (UGX)' },
    ],
    rows,
  };
}

async function outstandingRent(): Promise<TabularReport> {
  const leases = await prisma.lease.findMany({
    where: { status: 'ACTIVE' },
    include: { tenant: { select: { fullName: true } }, unit: { select: { unitNumber: true, property: { select: { name: true } } } } },
  });
  const rows: Record<string, string | number>[] = [];
  for (const lease of leases) {
    const { totalOutstanding } = await getLeaseLedger(lease.id);
    if (totalOutstanding > 0) {
      rows.push({
        tenant: lease.tenant.fullName,
        unit: `${lease.unit.property.name} · ${lease.unit.unitNumber}`,
        outstanding: totalOutstanding,
      });
    }
  }
  rows.sort((a, b) => Number(b.outstanding) - Number(a.outstanding));
  return {
    title: 'Outstanding Rent',
    columns: [
      { key: 'tenant', label: 'Tenant' },
      { key: 'unit', label: 'Unit' },
      { key: 'outstanding', label: 'Outstanding (UGX)' },
    ],
    rows,
  };
}

async function lateTenants(): Promise<TabularReport> {
  const report = await outstandingRent();
  // "Late" here means still owing anything as of today, which — since the
  // ledger is billing-day aware — only happens once a cycle's due date has
  // actually passed. Same underlying data as Outstanding Rent, presented as
  // its own report because that's a distinct question a landlord asks.
  return { ...report, title: 'Late Tenants' };
}

async function revenueTrends(months = 12): Promise<TabularReport> {
  const now = new Date();
  const rows: Record<string, string | number>[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const total = await prisma.payment.aggregate({
      where: { status: { in: ['CONFIRMED', 'PARTIALLY_REFUNDED'] }, createdAt: { gte: start, lt: end } },
      _sum: { amount: true },
    });
    rows.push({ month: start.toLocaleString('en-US', { month: 'short', year: 'numeric' }), revenue: toDisplayNumber(total._sum.amount) });
  }
  return {
    title: 'Revenue Trends',
    columns: [
      { key: 'month', label: 'Month' },
      { key: 'revenue', label: 'Revenue (UGX)' },
    ],
    rows,
  };
}

export async function getReport(type: ReportType): Promise<TabularReport> {
  switch (type) {
    case 'rent-roll':
      return rentRoll();
    case 'cash-flow':
      return cashFlow();
    case 'income-statement':
      return incomeStatement();
    case 'occupancy':
      return occupancy();
    case 'maintenance-costs':
      return maintenanceCosts();
    case 'outstanding-rent':
      return outstandingRent();
    case 'late-tenants':
      return lateTenants();
    case 'revenue-trends':
      return revenueTrends();
  }
}

// Re-export so callers don't need to know getOccupancySummary lives in the
// dashboard service — kept there since Milestone 4 already built it.
export { getOccupancySummary };
