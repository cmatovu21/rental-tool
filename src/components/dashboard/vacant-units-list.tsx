import { formatUgx } from '@/lib/money';

interface VacantUnit {
  id: string;
  unitNumber: string;
  propertyName: string;
  rentAmount: number;
  bedrooms: number;
}

export function VacantUnitsList({ units }: { units: VacantUnit[] }) {
  return (
    <div className="bg-white border border-rule rounded-lg p-5">
      <h3 className="font-display text-base font-semibold text-ink mb-4">
        Vacant units <span className="text-ink/40 font-normal">({units.length})</span>
      </h3>
      {units.length === 0 ? (
        <p className="text-sm text-ink/50">Every unit is occupied or under maintenance.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {units.map((u) => (
            <li key={u.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">
                  {u.propertyName} · {u.unitNumber}
                </p>
                <p className="text-xs text-ink/50">{u.bedrooms} bedroom{u.bedrooms === 1 ? '' : 's'}</p>
              </div>
              <p className="font-mono text-sm text-ink shrink-0">{formatUgx(u.rentAmount)}/mo</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
