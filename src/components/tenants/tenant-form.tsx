'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface TenantFormValues {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export function TenantForm({ mode, tenantId, initial }: { mode: 'create' | 'edit'; tenantId?: string; initial?: Partial<TenantFormValues> }) {
  const router = useRouter();
  const [form, setForm] = useState<TenantFormValues>({
    fullName: initial?.fullName ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    nationalId: initial?.nationalId ?? '',
    emergencyContactName: initial?.emergencyContactName ?? '',
    emergencyContactPhone: initial?.emergencyContactPhone ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof TenantFormValues) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res =
        mode === 'create'
          ? await fetch('/api/tenants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
          : await fetch(`/api/tenants/${tenantId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      const id = mode === 'create' ? data.tenant.id : tenantId;
      router.push(`/tenants/${id}`);
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
      <Field label="Full name" name="fullName" required value={form.fullName} onChange={update('fullName')} />
      <Field label="Phone number" name="phone" required value={form.phone} onChange={update('phone')} />
      <Field label="Email (optional)" type="email" name="email" value={form.email} onChange={update('email')} />
      <Field label="National ID (optional)" name="nationalId" value={form.nationalId} onChange={update('nationalId')} />
      <Field label="Emergency contact name" name="emergencyContactName" value={form.emergencyContactName} onChange={update('emergencyContactName')} />
      <Field label="Emergency contact phone" name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={update('emergencyContactPhone')} />
      <Button type="submit" loading={loading}>
        {mode === 'create' ? 'Add tenant' : 'Save changes'}
      </Button>
    </form>
  );
}
