'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface UnitFormValues {
  unitNumber: string;
  bedrooms: string;
  bathrooms: string;
  sizeSqm: string;
  rentAmount: string;
}

export function UnitForm({
  mode,
  propertyId,
  unitId,
  initial,
  onCreated,
}: {
  mode: 'create' | 'edit';
  propertyId?: string;
  unitId?: string;
  initial?: Partial<UnitFormValues>;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<UnitFormValues>({
    unitNumber: initial?.unitNumber ?? '',
    bedrooms: initial?.bedrooms ?? '1',
    bathrooms: initial?.bathrooms ?? '1',
    sizeSqm: initial?.sizeSqm ?? '',
    rentAmount: initial?.rentAmount ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof UnitFormValues) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const basePayload = {
        unitNumber: form.unitNumber,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        sizeSqm: form.sizeSqm ? Number(form.sizeSqm) : null,
        rentAmount: Number(form.rentAmount),
      };
      const res =
        mode === 'create'
          ? await fetch('/api/units', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ propertyId, ...basePayload }),
            })
          : await fetch(`/api/units/${unitId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(basePayload),
            });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      if (mode === 'create') {
        setForm({ unitNumber: '', bedrooms: '1', bathrooms: '1', sizeSqm: '', rentAmount: '' });
        onCreated?.();
      }
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Unit number/name" name="unitNumber" required value={form.unitNumber} onChange={update('unitNumber')} />
        <Field label="Monthly rent (UGX)" type="number" name="rentAmount" required min={1} value={form.rentAmount} onChange={update('rentAmount')} />
        <Field label="Bedrooms" type="number" name="bedrooms" required min={0} value={form.bedrooms} onChange={update('bedrooms')} />
        <Field label="Bathrooms" type="number" name="bathrooms" required min={0} value={form.bathrooms} onChange={update('bathrooms')} />
        <Field label="Size (sqm, optional)" type="number" name="sizeSqm" min={0} value={form.sizeSqm} onChange={update('sizeSqm')} />
      </div>
      <Button type="submit" loading={loading} className="mt-2">
        {mode === 'create' ? 'Add unit' : 'Save changes'}
      </Button>
    </form>
  );
}
