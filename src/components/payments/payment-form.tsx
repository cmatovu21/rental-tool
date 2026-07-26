'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface LeaseOption {
  id: string;
  label: string;
  rentAmount: number;
}

const METHODS = [
  { value: 'MTN_MOBILE_MONEY', label: 'MTN Mobile Money' },
  { value: 'AIRTEL_MONEY', label: 'Airtel Money' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CASH', label: 'Cash' },
];

export function PaymentForm() {
  const router = useRouter();
  const [leases, setLeases] = useState<LeaseOption[]>([]);
  const [leaseId, setLeaseId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('MTN_MOBILE_MONEY');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentType, setPaymentType] = useState('RENT');
  const [paidForPeriod, setPaidForPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/leases/active')
      .then((res) => res.json())
      .then((data) => {
        setLeases(data.leases ?? []);
        if (data.leases?.[0]) {
          setLeaseId(data.leases[0].id);
          setAmount(String(data.leases[0].rentAmount));
        }
      });
  }, []);

  function handleLeaseChange(id: string) {
    setLeaseId(id);
    const lease = leases.find((l) => l.id === id);
    if (lease) setAmount(String(lease.rentAmount));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let receiptUploadUrl: string | undefined;
      if (proofFile) {
        const formData = new FormData();
        formData.append('file', proofFile);
        const uploadRes = await fetch('/api/payments/upload-proof', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error ?? 'Could not upload proof of payment.');
          return;
        }
        receiptUploadUrl = uploadData.url;
      }

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaseId,
          amount: Number(amount),
          method,
          referenceNumber: method === 'CASH' ? undefined : referenceNumber,
          paymentType,
          paidForPeriod: `${paidForPeriod}-01`,
          receiptUploadUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      router.push(`/payments/${data.payment.id}`);
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white border border-rule rounded-lg p-6 max-w-xl">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="mb-4">
        <label htmlFor="leaseId" className="block text-sm font-medium text-ink mb-1.5">
          Tenant / Lease
        </label>
        <select
          id="leaseId"
          value={leaseId}
          onChange={(e) => handleLeaseChange(e.target.value)}
          className="w-full rounded-md border border-rule bg-white px-3 py-2 text-ink focus:border-forest focus:ring-1 focus:ring-forest"
        >
          {leases.length === 0 && <option>No active leases</option>}
          {leases.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (UGX)" type="number" name="amount" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Field label="For period" type="month" name="paidForPeriod" required value={paidForPeriod} onChange={(e) => setPaidForPeriod(e.target.value)} />
      </div>

      <div className="mb-4">
        <label htmlFor="method" className="block text-sm font-medium text-ink mb-1.5">
          Payment method
        </label>
        <select
          id="method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full rounded-md border border-rule bg-white px-3 py-2 text-ink focus:border-forest focus:ring-1 focus:ring-forest"
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {method !== 'CASH' && (
        <Field
          label="Reference number"
          name="referenceNumber"
          required
          placeholder="e.g. MTN.240912.1345.A1B2C3"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />
      )}

      <div className="mb-4">
        <label htmlFor="paymentType" className="block text-sm font-medium text-ink mb-1.5">
          Payment type
        </label>
        <select
          id="paymentType"
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
          className="w-full rounded-md border border-rule bg-white px-3 py-2 text-ink focus:border-forest focus:ring-1 focus:ring-forest"
        >
          <option value="RENT">Rent</option>
          <option value="ADVANCE">Advance</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-ink mb-1.5">Proof of payment (optional)</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
      </div>

      <Button type="submit" loading={loading} disabled={!leaseId}>
        Record payment & issue receipt
      </Button>
    </form>
  );
}
