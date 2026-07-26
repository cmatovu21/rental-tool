import { formatUgx } from '@/lib/money';

const METHOD_LABELS: Record<string, string> = {
  MTN_MOBILE_MONEY: 'MTN MoMo',
  AIRTEL_MONEY: 'Airtel Money',
  BANK_TRANSFER: 'Bank transfer',
  CASH: 'Cash',
};

interface PaymentRow {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  tenantName: string;
  unitLabel: string;
}

export function RecentPaymentsTable({ payments }: { payments: PaymentRow[] }) {
  return (
    <div className="bg-white border border-rule rounded-lg p-5">
      <h3 className="font-display text-base font-semibold text-ink mb-4">Recent payments</h3>
      {payments.length === 0 ? (
        <p className="text-sm text-ink/50">No payments recorded yet.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {payments.map((p) => (
            <li key={p.id} className="py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{p.tenantName}</p>
                <p className="text-xs text-ink/50 truncate">
                  {p.unitLabel} · {METHOD_LABELS[p.method] ?? p.method}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-sm text-ink">{formatUgx(p.amount)}</p>
                <p className="text-xs text-ink/45">{new Date(p.createdAt).toLocaleDateString('en-GB')}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
