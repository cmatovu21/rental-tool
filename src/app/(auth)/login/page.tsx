'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

const ROLE_HOME: Record<string, string> = {
  LANDLORD: '/dashboard',
  CARETAKER: '/dashboard',
  ACCOUNTANT: '/dashboard',
  TENANT: '/portal',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      router.push(ROLE_HOME[data.user.role] ?? '/dashboard');
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Log in" subtitle="Welcome back — enter your details to continue.">
      {error && <Alert tone="error">{error}</Alert>}
      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" loading={loading}>
          Log in
        </Button>
      </form>
      <div className="mt-5 flex justify-between text-sm">
        <Link href="/forgot-password" className="text-forest hover:underline">
          Forgot password?
        </Link>
        <Link href="/register" className="text-forest hover:underline">
          New tenant? Register
        </Link>
      </div>
    </AuthCard>
  );
}
