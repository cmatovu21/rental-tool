'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      router.push('/portal');
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Create your tenant account" subtitle="Track your lease, payments, and maintenance requests.">
      {error && <Alert tone="error">{error}</Alert>}
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Full name" name="fullName" required value={form.fullName} onChange={update('fullName')} />
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update('email')}
        />
        <Field
          label="Phone number"
          type="tel"
          name="phone"
          placeholder="0701234567"
          required
          value={form.phone}
          onChange={update('phone')}
        />
        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={update('password')}
        />
        <Button type="submit" loading={loading}>
          Create account
        </Button>
      </form>
      <p className="mt-5 text-sm text-center text-ink/60">
        Already have an account?{' '}
        <Link href="/login" className="text-forest hover:underline">
          Log in
        </Link>
      </p>
      <p className="mt-2 text-xs text-center text-ink/40">
        Landlord, caretaker, or accountant? Your account is created by invitation.
      </p>
    </AuthCard>
  );
}
