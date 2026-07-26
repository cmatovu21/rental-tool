import { notFound } from 'next/navigation';
import { getTenantProfile } from '@/server/services/tenants';
import { getVacantUnits } from '@/server/services/dashboard';
import { formatUgx } from '@/lib/money';
import { TenantForm } from '@/components/tenants/tenant-form';
import { LeaseForm } from '@/components/tenants/lease-form';
import { DocumentList } from '@/components/tenants/document-list';
import { InspectionList } from '@/components/tenants/inspection-list';
import { TerminateLeaseButton } from '@/components/tenants/terminate-lease-button';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-forest-50 text-forest',
  PROSPECTIVE: 'bg-ochre/10 text-ochre',
  FORMER: 'bg-ink/10 text-ink/50',
};

const METHOD_LABELS: Record<string, string> = {
  MTN_MOBILE_MONEY: 'MTN MoMo',
  AIRTEL_MONEY: 'Airtel Money',
  BANK_TRANSFER: 'Bank transfer',
  CASH: 'Cash',
};

export default async function TenantDetailPage({ params }: { params: { tenantId: string } }) {
  const profile = await getTenantProfile(params.tenantId);
  if (!profile) notFound();
  const { tenant, payments, inspections } = profile;

  const activeLease = tenant.leases.find((l) => l.status === 'ACTIVE');
  const mostRecentLease = tenant.leases[0];
  const vacantUnits = activeLease ? [] : await getVacantUnits();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{tenant.fullName}</h1>
          <p className="text-ink/60">{tenant.phone}{tenant.email ? ` · ${tenant.email}` : ''}</p>
          {tenant.emergencyContactName && (
            <p className="text-sm text-ink/50 mt-1">
              Emergency contact: {tenant.emergencyContactName} ({tenant.emergencyContactPhone})
            </p>
          )}
        </div>
        <span className={`text-xs font-mono uppercase px-2 py-1 rounded ${STATUS_COLORS[tenant.status]}`}>
          {tenant.status.toLowerCase()}
        </span>
      </div>

      <details className="bg-white border border-rule rounded-lg p-5">
        <summary className="font-display text-base font-semibold text-ink cursor-pointer">Edit profile</summary>
        <div className="mt-4">
          <TenantForm
            mode="edit"
            tenantId={tenant.id}
            initial={{
              fullName: tenant.fullName,
              phone: tenant.phone,
              email: tenant.email ?? '',
              nationalId: tenant.nationalId ?? '',
              emergencyContactName: tenant.emergencyContactName ?? '',
              emergencyContactPhone: tenant.emergencyContactPhone ?? '',
            }}
          />
        </div>
      </details>

      <div className="bg-white border border-rule rounded-lg p-5">
        <h3 className="font-display text-base font-semibold text-ink mb-4">Lease</h3>
        {activeLease ? (
          <div>
            <p className="text-sm text-ink">
              <span className="font-medium">{activeLease.unit.property.name} · {activeLease.unit.unitNumber}</span>
            </p>
            <p className="text-sm text-ink/60 mt-1">
              {new Date(activeLease.startDate).toLocaleDateString('en-GB')} –{' '}
              {new Date(activeLease.endDate).toLocaleDateString('en-GB')} ·{' '}
              <span className="font-mono">{formatUgx(Number(activeLease.rentAmount))}/mo</span> · billing day {activeLease.billingDay}
            </p>
            {activeLease.deposit && (
              <p className="text-sm text-ink/60 mt-1">
                Deposit: {formatUgx(Number(activeLease.deposit.amountCollected))} collected
                {Number(activeLease.deposit.amountRefunded) > 0 && `, ${formatUgx(Number(activeLease.deposit.amountRefunded))} refunded`}
              </p>
            )}
            <div className="mt-3">
              <TerminateLeaseButton leaseId={activeLease.id} />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-ink/50 mb-4">No active lease.</p>
            <LeaseForm tenantId={tenant.id} vacantUnits={vacantUnits} />
          </div>
        )}
      </div>

      <DocumentList tenantId={tenant.id} initialDocuments={tenant.documents} />

      <div className="bg-white border border-rule rounded-lg p-5">
        <h3 className="font-display text-base font-semibold text-ink mb-4">Payment history</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-ink/50">No payments recorded yet.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {payments.map((p) => (
              <li key={p.id} className="py-2.5 flex items-center justify-between">
                <span className="text-sm text-ink">
                  Unit {p.unitNumber} · {METHOD_LABELS[p.method] ?? p.method}
                </span>
                <div className="text-right">
                  <p className="font-mono text-sm text-ink">{formatUgx(p.amount)}</p>
                  <p className="text-xs text-ink/45">{new Date(p.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <InspectionList leaseId={mostRecentLease?.id ?? null} inspections={inspections} />
    </div>
  );
}
