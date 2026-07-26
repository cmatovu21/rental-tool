interface LeaseExpiry {
  id: string;
  tenantName: string;
  unitLabel: string;
  endDate: string;
  daysRemaining: number;
}

export function LeaseExpiryList({ leases }: { leases: LeaseExpiry[] }) {
  return (
    <div className="bg-white border border-rule rounded-lg p-5">
      <h3 className="font-display text-base font-semibold text-ink mb-4">Lease expiry — next 60 days</h3>
      {leases.length === 0 ? (
        <p className="text-sm text-ink/50">No leases expiring in the next 60 days.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {leases.map((l) => (
            <li key={l.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">{l.tenantName}</p>
                <p className="text-xs text-ink/50">{l.unitLabel}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm text-ink">{new Date(l.endDate).toLocaleDateString('en-GB')}</p>
                <p className={`text-xs ${l.daysRemaining <= 14 ? 'text-ochre' : 'text-ink/45'}`}>
                  {l.daysRemaining} day{l.daysRemaining === 1 ? '' : 's'} left
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
