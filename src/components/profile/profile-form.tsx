'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export function ProfileForm({
  initial,
}: {
  initial: { fullName: string; email: string; phone: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white border border-rule rounded-lg p-6 max-w-md">
      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">Your profile has been updated.</Alert>}
      <Field label="Full name" name="fullName" required value={form.fullName} onChange={update('fullName')} />
      <Field label="Email" type="email" name="email" required value={form.email} onChange={update('email')} />
      <Field label="Phone number" name="phone" required value={form.phone} onChange={update('phone')} />
      <Button type="submit" loading={loading}>
        Save changes
      </Button>
    </form>
  );
}
