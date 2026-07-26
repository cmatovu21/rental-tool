import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { formatUgx } from '@/lib/money';

export default async function PortalPage() {
  const session = await getCurrentUser();
  const tenant = session ? await prisma.tenant.findUnique({ where: { userId: session.sub } }) : null;
  const lease = tenant
    ? await prisma.lease.findFirst({
        where: { tenantId: tenant.id, status: 'ACTIVE' },
        include: { unit: { select: { unitNumber: true, property: { select: { name: true, address: true } } } } },
      })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink mb-1">
          Welcome, {session?.fullName.split(' ')[0]}
        </h1>
        <p className="text-ink/60 text-sm">Here&apos;s your lease at a glance.</p>
      </div>

      {lease ? (
        <div className="bg-white border border-rule rounded-lg p-5">
          <h2 className="font-display text-lg font-semibold text-ink mb-1">
            {lease.unit.property.name} · {lease.unit.unitNumber}
          </h2>
          <p className="text-sm text-ink/50 mb-4">{lease.unit.property.address}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-ink/50">Monthly rent</p>
              <p className="font-mono text-ink">{formatUgx(Number(lease.rentAmount))}</p>
            </div>
            <div>
              <p className="text-ink/50">Billing day</p>
              <p className="text-ink">Day {lease.billingDay} of each month</p>
            </div>
            <div>
              <p className="text-ink/50">Lease ends</p>
              <p className="text-ink">{new Date(lease.endDate).toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-rule rounded-lg p-6 text-center">
          <p className="text-ink/60">You don&apos;t have an active lease yet.</p>
        </div>
      )}

      <div className="bg-white border border-rule rounded-lg p-5 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Maintenance</h3>
          <p className="text-sm text-ink/50">Report an issue or check on an existing request.</p>
        </div>
        <Link href="/portal/maintenance" className="text-forest hover:underline text-sm">
          View requests →
        </Link>
      </div>
    </div>
  );
}
