'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { formatUgx } from '@/lib/money';

interface Expense {
  id: string;
  amount: number;
  description: string | null;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-ochre/10 text-ochre',
  APPROVED: 'bg-forest-50 text-forest',
  REJECTED: 'bg-red-50 text-red-700',
};

export function ExpensePanel({ ticketId, expenses, canApprove }: { ticketId: string; expenses: Expense[]; canApprove: boolean }) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/maintenance/tickets/${ticketId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), description }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.');
    } else {
      setAmount('');
      setDescription('');
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDecision(expenseId: string, decision: 'APPROVED' | 'REJECTED') {
    await fetch(`/api/maintenance/expenses/${expenseId}/decision`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    });
    router.refresh();
  }

  return (
    <div className="bg-white border border-rule rounded-lg p-5">
      <h3 className="font-display text-base font-semibold text-ink mb-4">Expenses</h3>
      {expenses.length === 0 ? (
        <p className="text-sm text-ink/50 mb-4">No expenses logged yet.</p>
      ) : (
        <ul className="divide-y divide-rule mb-4">
          {expenses.map((e) => (
            <li key={e.id} className="py-2.5 flex items-center justify-between">
              <div>
                <p className="text-sm text-ink">{e.description || 'Expense'}</p>
                <span className={`text-xs font-mono uppercase px-1.5 py-0.5 rounded ${STATUS_COLORS[e.status]}`}>{e.status.toLowerCase()}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-ink">{formatUgx(e.amount)}</span>
                {canApprove && e.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleDecision(e.id, 'APPROVED')} className="text-xs text-forest hover:underline">
                      Approve
                    </button>
                    <button onClick={() => handleDecision(e.id, 'REJECTED')} className="text-xs text-red-700 hover:underline">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <details>
        <summary className="text-sm text-forest hover:underline cursor-pointer">+ Log an expense</summary>
        <form onSubmit={handleAdd} noValidate className="mt-4">
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="Amount (UGX)" type="number" name="amount" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Field label="Description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button type="submit" loading={loading}>
            Save expense
          </Button>
        </form>
      </details>
    </div>
  );
}
