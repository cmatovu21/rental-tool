'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export function RefundForm({ paymentId, maxAmount }: { paymentId: string; maxAmount: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(maxAmount));
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/${paymentId}/refunds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (maxAmount <= 0) return null;

  return (
    <details className="bg-white border border-rule rounded-lg p-5">
      <summary className="font-display text-base font-semibold text-ink cursor-pointer">Issue a refund</summary>
      <form onSubmit={handleSubmit} noValidate className="mt-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label={`Refund amount (max ${maxAmount.toLocaleString()})`} type="number" name="amount" required max={maxAmount} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Field label="Reason" name="reason" required value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button type="submit" loading={loading}>
          Issue refund
        </Button>
      </form>
    </details>
  );
}
