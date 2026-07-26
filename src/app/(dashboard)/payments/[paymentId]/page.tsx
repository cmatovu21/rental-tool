import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { getPaymentDetail } from '@/server/services/payments';
import { getLeaseLedger } from '@/server/services/ledger';
import { formatUgx } from '@/lib/money';
import { RefundForm } from '@/components/payments/refund-form';

const METHOD_LABELS: Record<string, string> = {
  MTN_MOBILE_MONEY: 'MTN Mobile Money',
  AIRTEL_MONEY: 'Airtel Money',
  BANK_TRANSFER: 'Bank Transfer',
  CASH: 'Cash',
};

export default async function PaymentDetailPage({ params }: { params: { paymentId: string } }) {
  const [session, paymentRaw] = await Promise.all([getCurrentUser(), getPaymentDetail(params.paymentId)]);
  if (!paymentRaw) notFound();

  const amount = Number(paymentRaw.amount);
  const refundedTotal = paymentRaw.refunds.reduce((sum, r) => sum + Number(r.amount), 0);
  const remainingRefundable = amount - refundedTotal;
  const ledger = await getLeaseLedger(paymentRaw.leaseId);
  const canRefund = session?.role === 'LANDLORD' || session?.role === 'ACCOUNTANT';

  return (
    <div className="space-y-6">
      <div>
        <Link href="/payments" className="text-sm text-forest hover:underline">
          ← All payments
        </Link>
        <h1 className="font-display text-2xl font-semibold text-ink mt-1">{formatUgx(amount)}</h1>
        <p className="text-ink/60">
          {paymentRaw.lease.tenant.fullName} · {paymentRaw.lease.unit.property.name} · {paymentRaw.lease.unit.unitNumber}
        </p>
      </div>

      <div className="bg-white border border-rule rounded-lg p-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-ink/50">Method</p>
          <p className="text-ink font-medium">{METHOD_LABELS[paymentRaw.method] ?? paymentRaw.method}</p>
        </div>
        <div>
          <p className="text-ink/50">Reference number</p>
          <p className="text-ink font-mono">{paymentRaw.referenceNumber ?? '—'}</p>
        </div>
        <div>
          <p className="text-ink/50">Type</p>
          <p className="text-ink font-medium">{paymentRaw.paymentType}</p>
        </div>
        <div>
          <p className="text-ink/50">Status</p>
          <p className="text-ink font-medium">{paymentRaw.status.replace('_', ' ')}</p>
        </div>
        <div>
          <p className="text-ink/50">Recorded</p>
          <p className="text-ink">{new Date(paymentRaw.createdAt).toLocaleString('en-GB')}</p>
        </div>
        {paymentRaw.receiptUploadUrl && (
          <div>
            <p className="text-ink/50">Proof of payment</p>
            <a href={paymentRaw.receiptUploadUrl} target="_blank" rel="noopener noreferrer" className="text-forest hover:underline">
              View upload ↗
            </a>
          </div>
        )}
      </div>

      {paymentRaw.receipt && (
        <div className="bg-white border border-rule rounded-lg p-5 flex items-center justify-between">
          <div>
            <p className="font-display text-base font-semibold text-ink">Receipt {paymentRaw.receipt.receiptNumber}</p>
            <p className="text-xs text-ink/50">Generated automatically when this payment was recorded</p>
          </div>
          {paymentRaw.receipt.pdfUrl && (
            <a href={paymentRaw.receipt.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-forest hover:underline text-sm">
              Download PDF ↗
            </a>
          )}
        </div>
      )}

      {paymentRaw.refunds.length > 0 && (
        <div className="bg-white border border-rule rounded-lg p-5">
          <h3 className="font-display text-base font-semibold text-ink mb-3">Refund history</h3>
          <ul className="divide-y divide-rule">
            {paymentRaw.refunds.map((r) => (
              <li key={r.id} className="py-2 flex items-center justify-between text-sm">
                <span className="text-ink/70">{r.reason}</span>
                <span className="font-mono text-ink">{formatUgx(Number(r.amount))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canRefund && <RefundForm paymentId={paymentRaw.id} maxAmount={remainingRefundable} />}

      <div className="bg-white border border-rule rounded-lg p-5">
        <h3 className="font-display text-base font-semibold text-ink mb-1">Monthly ledger</h3>
        <p className="text-xs text-ink/50 mb-4">
          Total outstanding on this lease: <span className="font-mono text-ochre">{formatUgx(ledger.totalOutstanding)}</span>
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink/50 text-xs uppercase">
              <th className="pb-2 font-normal">Period</th>
              <th className="pb-2 font-normal text-right">Expected</th>
              <th className="pb-2 font-normal text-right">Paid</th>
              <th className="pb-2 font-normal text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {ledger.rows.map((row) => (
              <tr key={row.period}>
                <td className="py-2">{row.period}</td>
                <td className="py-2 text-right font-mono">{formatUgx(row.expected)}</td>
                <td className="py-2 text-right font-mono">{formatUgx(row.paid)}</td>
                <td className={`py-2 text-right font-mono ${row.outstanding > 0 ? 'text-ochre' : 'text-ink/40'}`}>
                  {formatUgx(row.outstanding)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
