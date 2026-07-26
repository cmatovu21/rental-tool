'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { GpsField } from '@/components/properties/gps-field';

interface PropertyFormValues {
  name: string;
  address: string;
  gpsLat: string;
  gpsLng: string;
  description: string;
}

export function PropertyForm({
  mode,
  propertyId,
  initial,
}: {
  mode: 'create' | 'edit';
  propertyId?: string;
  initial?: Partial<PropertyFormValues>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<PropertyFormValues>({
    name: initial?.name ?? '',
    address: initial?.address ?? '',
    gpsLat: initial?.gpsLat ?? '',
    gpsLng: initial?.gpsLng ?? '',
    description: initial?.description ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof PropertyFormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        address: form.address,
        gpsLat: form.gpsLat ? Number(form.gpsLat) : null,
        gpsLng: form.gpsLng ? Number(form.gpsLng) : null,
        description: form.description || null,
      };
      const res =
        mode === 'create'
          ? await fetch('/api/properties', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/properties/${propertyId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      const id = mode === 'create' ? data.property.id : propertyId;
      router.push(`/properties/${id}`);
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
      <Field label="Property name" name="name" required value={form.name} onChange={update('name')} />
      <Field label="Address" name="address" required value={form.address} onChange={update('address')} />
      <GpsField lat={form.gpsLat} lng={form.gpsLng} onChange={(lat, lng) => setForm((f) => ({ ...f, gpsLat: lat, gpsLng: lng }))} />
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-ink mb-1.5">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={update('description')}
          className="w-full rounded-md border border-rule bg-white px-3 py-2 text-ink focus:border-forest focus:ring-1 focus:ring-forest"
        />
      </div>
      <Button type="submit" loading={loading}>
        {mode === 'create' ? 'Add property' : 'Save changes'}
      </Button>
    </form>
  );
}
