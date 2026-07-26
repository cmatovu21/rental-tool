import Link from 'next/link';
import { listPayments } from '@/server/services/payments';
import { formatUgx } from '@/lib/money';
import { Button } from '@/components/ui/button';

const METHOD_LABELS: Record<string, string> = {
  MTN_MOBILE_MONEY: 'MTN MoMo',
  AIRTEL_MONEY: 'Airtel Money',
  BANK_TRANSFER: 'Bank transfer',
  CASH: 'Cash',
};

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-forest-50 text-forest',
  PENDING: 'bg-ochre/10 text-ochre',
  REFUNDED: 'bg-ink/10 text-ink/50',
  PARTIALLY_REFUNDED: 'bg-ochre/10 text-ochre',
};

export default async function PaymentsPage() {
  const payments = await listPayments();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Payments</h1>
          <p className="text-ink/60 text-sm">{payments.length} recorded</p>
        </div>
        <Link href="/payments/new">
          <Button type="button" fullWidth={false} className="px-5">
            + Record payment
          </Button>
        </Link>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white border border-rule rounded-lg p-10 text-center">
          <p className="text-ink/60">No payments recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-rule rounded-lg divide-y divide-rule">
          {payments.map((p) => (
            <Link key={p.id} href={`/payments/${p.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-paper">
              <div>
                <p className="text-sm font-medium text-ink">{p.tenantName}</p>
                <p className="text-xs text-ink/50">
                  {p.unitLabel} · {METHOD_LABELS[p.method] ?? p.method} · {p.paymentType.toLowerCase()}
                </p>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="font-mono text-sm text-ink">{formatUgx(p.amount)}</p>
                  <p className="text-xs text-ink/45">{new Date(p.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
                <span className={`text-xs font-mono uppercase px-2 py-1 rounded ${STATUS_COLORS[p.status]}`}>
                  {p.status.replace('_', ' ').toLowerCase()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
