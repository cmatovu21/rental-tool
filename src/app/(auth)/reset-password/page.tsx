'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [identifier, setIdentifier] = useState(params.get('identifier') ?? '');
  const [secret, setSecret] = useState(params.get('token') ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, secret, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthCard title="Password reset">
        <Alert tone="success">Your password has been reset. Taking you to login…</Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" subtitle="Enter the code or link token you received, plus your new password.">
      {error && <Alert tone="error">{error}</Alert>}
      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="Email or phone number"
          name="identifier"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <Field
          label="Reset code or link token"
          name="secret"
          required
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <Field
          label="New password"
          type="password"
          name="newPassword"
          autoComplete="new-password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Field
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button type="submit" loading={loading}>
          Reset password
        </Button>
      </form>
      <p className="mt-5 text-sm text-center">
        <Link href="/login" className="text-forest hover:underline">
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
