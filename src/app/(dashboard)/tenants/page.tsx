import Link from 'next/link';
import { listTenants } from '@/server/services/tenants';
import { Button } from '@/components/ui/button';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-forest-50 text-forest',
  PROSPECTIVE: 'bg-ochre/10 text-ochre',
  FORMER: 'bg-ink/10 text-ink/50',
};

export default async function TenantsPage() {
  const tenants = await listTenants();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Tenants</h1>
          <p className="text-ink/60 text-sm">{tenants.length} tenant{tenants.length === 1 ? '' : 's'}</p>
        </div>
        <Link href="/tenants/new">
          <Button type="button" fullWidth={false} className="px-5">
            + Add tenant
          </Button>
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="bg-white border border-rule rounded-lg p-10 text-center">
          <p className="text-ink/60">No tenants yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-rule rounded-lg divide-y divide-rule">
          {tenants.map((t) => (
            <Link key={t.id} href={`/tenants/${t.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-paper">
              <div>
                <p className="text-sm font-medium text-ink">{t.fullName}</p>
                <p className="text-xs text-ink/50">
                  {t.phone}
                  {t.currentUnit ? ` · ${t.currentUnit}` : ''}
                </p>
              </div>
              <span className={`text-xs font-mono uppercase px-2 py-1 rounded ${STATUS_COLORS[t.status]}`}>
                {t.status.toLowerCase()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
