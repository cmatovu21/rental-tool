import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { listTicketsForTenant } from '@/server/services/maintenance';
import { Button } from '@/components/ui/button';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-ochre/10 text-ochre',
  IN_PROGRESS: 'bg-forest-50 text-forest',
  AWAITING_APPROVAL: 'bg-ink/10 text-ink/70',
  COMPLETED: 'bg-forest-50 text-forest',
  CLOSED: 'bg-ink/10 text-ink/40',
};

export default async function TenantMaintenancePage() {
  const session = await getCurrentUser();
  const tickets = session ? await listTicketsForTenant(session.sub) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Maintenance requests</h1>
        <Link href="/portal/maintenance/new">
          <Button type="button" fullWidth={false} className="px-5">
            + New request
          </Button>
        </Link>
      </div>
      {tickets.length === 0 ? (
        <div className="bg-white border border-rule rounded-lg p-10 text-center">
          <p className="text-ink/60">No requests yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-rule rounded-lg divide-y divide-rule">
          {tickets.map((t) => (
            <div key={t.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{t.title}</p>
                <p className="text-xs text-ink/50">{new Date(t.createdAt).toLocaleDateString('en-GB')}</p>
              </div>
              <span className={`text-xs font-mono uppercase px-2 py-1 rounded ${STATUS_COLORS[t.status]}`}>
                {t.status.replace('_', ' ').toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
