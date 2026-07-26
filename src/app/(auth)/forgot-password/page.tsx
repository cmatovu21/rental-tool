'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [channel, setChannel] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, channel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <AuthCard title="Check your email or phone">
        <Alert tone="success">
          If an account matches what you entered, we&apos;ve sent {channel === 'EMAIL' ? 'a reset link' : 'a code'} to it.
        </Alert>
        <Link
          href={`/reset-password?identifier=${encodeURIComponent(identifier)}`}
          className="block text-center text-sm text-forest hover:underline mt-2"
        >
          I have {channel === 'EMAIL' ? 'the link' : 'the code'} — reset my password
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password" subtitle="Tell us where to send your reset instructions.">
      {error && <Alert tone="error">{error}</Alert>}
      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="Email or phone number"
          name="identifier"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <fieldset className="mb-5">
          <legend className="block text-sm font-medium text-ink mb-1.5">Send instructions via</legend>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="channel"
                checked={channel === 'EMAIL'}
                onChange={() => setChannel('EMAIL')}
                className="accent-forest"
              />
              Email link
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="channel"
                checked={channel === 'SMS'}
                onChange={() => setChannel('SMS')}
                className="accent-forest"
              />
              SMS code
            </label>
          </div>
        </fieldset>
        <Button type="submit" loading={loading}>
          Send instructions
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
