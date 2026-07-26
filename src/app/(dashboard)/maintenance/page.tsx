import Link from 'next/link';
import { listTicketsForStaff } from '@/server/services/maintenance';
import { formatUgx } from '@/lib/money';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-ochre/10 text-ochre',
  IN_PROGRESS: 'bg-forest-50 text-forest',
  AWAITING_APPROVAL: 'bg-ink/10 text-ink/70',
  COMPLETED: 'bg-forest-50 text-forest',
  CLOSED: 'bg-ink/10 text-ink/40',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-ink/40',
  MEDIUM: 'text-ink/70',
  HIGH: 'text-ochre',
  URGENT: 'text-red-700',
};

export default async function MaintenancePage() {
  const tickets = await listTicketsForStaff();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Maintenance</h1>
      {tickets.length === 0 ? (
        <div className="bg-white border border-rule rounded-lg p-10 text-center">
          <p className="text-ink/60">No maintenance tickets yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-rule rounded-lg divide-y divide-rule">
          {tickets.map((t) => (
            <Link key={t.id} href={`/maintenance/${t.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-paper">
              <div>
                <p className="text-sm font-medium text-ink">{t.title}</p>
                <p className="text-xs text-ink/50">
                  {t.unitLabel}
                  {t.tenantName ? ` · ${t.tenantName}` : ''} ·{' '}
                  <span className={PRIORITY_COLORS[t.priority]}>{t.priority.toLowerCase()}</span>
                </p>
              </div>
              <div className="text-right flex items-center gap-3">
                {t.pendingExpenseTotal > 0 && (
                  <span className="text-xs font-mono text-ochre">{formatUgx(t.pendingExpenseTotal)} pending</span>
                )}
                <span className={`text-xs font-mono uppercase px-2 py-1 rounded ${STATUS_COLORS[t.status]}`}>
                  {t.status.replace('_', ' ').toLowerCase()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
