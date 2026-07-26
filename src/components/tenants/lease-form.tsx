'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { formatUgx } from '@/lib/money';

interface VacantUnit {
  id: string;
  unitNumber: string;
  propertyName: string;
  rentAmount: number;
}

export function LeaseForm({ tenantId, vacantUnits }: { tenantId: string; vacantUnits: VacantUnit[] }) {
  const router = useRouter();
  const [unitId, setUnitId] = useState(vacantUnits[0]?.id ?? '');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [rentAmount, setRentAmount] = useState(String(vacantUnits[0]?.rentAmount ?? ''));
  const [depositAmount, setDepositAmount] = useState(String(vacantUnits[0]?.rentAmount ?? ''));
  const [billingDay, setBillingDay] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleUnitChange(id: string) {
    setUnitId(id);
    const unit = vacantUnits.find((u) => u.id === id);
    if (unit) {
      setRentAmount(String(unit.rentAmount));
      setDepositAmount(String(unit.rentAmount));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!unitId) {
      setError('Choose a vacant unit.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/leases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          unitId,
          startDate,
          endDate,
          rentAmount: Number(rentAmount),
          depositAmount: Number(depositAmount),
          billingDay: Number(billingDay),
        }),
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

  if (vacantUnits.length === 0) {
    return <p className="text-sm text-ink/50">No vacant units available right now.</p>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="mb-4">
        <label htmlFor="unitId" className="block text-sm font-medium text-ink mb-1.5">
          Unit
        </label>
        <select
          id="unitId"
          value={unitId}
          onChange={(e) => handleUnitChange(e.target.value)}
          className="w-full rounded-md border border-rule bg-white px-3 py-2 text-ink focus:border-forest focus:ring-1 focus:ring-forest"
        >
          {vacantUnits.map((u) => (
            <option key={u.id} value={u.id}>
              {u.propertyName} · {u.unitNumber} — {formatUgx(u.rentAmount)}/mo
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date" type="date" name="startDate" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Field label="End date" type="date" name="endDate" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <Field label="Monthly rent (UGX)" type="number" name="rentAmount" required value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} />
        <Field label="Deposit (UGX)" type="number" name="depositAmount" required value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
        <Field label="Billing day (1-28)" type="number" name="billingDay" min={1} max={28} required value={billingDay} onChange={(e) => setBillingDay(e.target.value)} />
      </div>
      <Button type="submit" loading={loading} className="mt-2">
        Create lease & collect deposit
      </Button>
    </form>
  );
}
