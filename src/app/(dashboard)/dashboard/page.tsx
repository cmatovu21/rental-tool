import { getCurrentUser } from '@/lib/auth/session';
import { formatUgx } from '@/lib/money';
import {
  getFinancialSummary,
  getMaintenanceSummary,
  getOccupancySummary,
  getRecentPayments,
  getRevenueTrend,
  getUpcomingLeaseExpiries,
  getVacantUnits,
} from '@/server/services/dashboard';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { RevenueTrendChart } from '@/components/dashboard/revenue-trend-chart';
import { OccupancyChart } from '@/components/dashboard/occupancy-chart';
import { MaintenanceChart } from '@/components/dashboard/maintenance-chart';
import { RecentPaymentsTable } from '@/components/dashboard/recent-payments-table';
import { VacantUnitsList } from '@/components/dashboard/vacant-units-list';
import { LeaseExpiryList } from '@/components/dashboard/lease-expiry-list';

/**
 * Section visibility follows the Screen List doc: Landlord sees everything
 * (both KPI rows, both chart rows); Caretaker sees only the operational
 * side (occupancy/maintenance/vacant units/lease expiry); Accountant sees
 * only the financial side. Every query still runs regardless of role at
 * this scale — a few extra aggregate queries cost far less than the
 * complexity of conditionally skipping them.
 */
export default async function DashboardPage() {
  const session = await getCurrentUser();
  const role = session?.role ?? 'LANDLORD';
  const showFinancials = role === 'LANDLORD' || role === 'ACCOUNTANT';
  const showOperations = role === 'LANDLORD' || role === 'CARETAKER';

  const [financials, occupancy, maintenance, recentPayments, vacantUnits, leaseExpiries, revenueTrend] =
    await Promise.all([
      getFinancialSummary(),
      getOccupancySummary(),
      getMaintenanceSummary(),
      getRecentPayments(5),
      getVacantUnits(),
      getUpcomingLeaseExpiries(60),
      getRevenueTrend(6),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Welcome, {session?.fullName.split(' ')[0]}
        </h1>
        <p className="text-ink/60 text-sm">Here&apos;s how things stand for {financials.monthLabel}.</p>
      </div>

      {showFinancials && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Expected rent" value={formatUgx(financials.expected)} caption="Active leases this month" />
          <KpiCard
            label="Collected rent"
            value={formatUgx(financials.collected)}
            tone="positive"
            caption={`${financials.expected > 0 ? Math.round((financials.collected / financials.expected) * 100) : 0}% of expected`}
          />
          <KpiCard
            label="Outstanding rent"
            value={formatUgx(financials.outstanding)}
            tone={financials.outstanding > 0 ? 'warning' : 'default'}
            caption="Still owed this month"
          />
          <KpiCard
            label="Occupancy"
            value={`${occupancy.occupancyRate}%`}
            caption={`${occupancy.occupied} of ${occupancy.total} units`}
          />
        </div>
      )}

      {showOperations && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {!showFinancials && (
            <KpiCard
              label="Occupancy"
              value={`${occupancy.occupancyRate}%`}
              caption={`${occupancy.occupied} of ${occupancy.total} units`}
            />
          )}
          <KpiCard label="Vacant units" value={String(occupancy.vacant)} />
          <KpiCard
            label="Open maintenance"
            value={String(maintenance.totalOpenIssues)}
            tone={maintenance.totalOpenIssues > 0 ? 'warning' : 'default'}
          />
          <KpiCard label="Leases expiring soon" value={String(leaseExpiries.length)} caption="Within 60 days" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {showFinancials && (
          <div className="lg:col-span-2">
            <RevenueTrendChart data={revenueTrend} />
          </div>
        )}
        {showOperations && <OccupancyChart {...occupancy} />}
      </div>

      {showOperations && (
        <div className="grid lg:grid-cols-2 gap-4">
          <MaintenanceChart
            open={maintenance.open}
            inProgress={maintenance.inProgress}
            awaitingApproval={maintenance.awaitingApproval}
            completed={maintenance.completed}
          />
          <LeaseExpiryList leases={leaseExpiries} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {showFinancials && <RecentPaymentsTable payments={recentPayments} />}
        {showOperations && <VacantUnitsList units={vacantUnits} />}
      </div>
    </div>
  );
}
