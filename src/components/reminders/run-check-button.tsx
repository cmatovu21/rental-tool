'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export function RunCheckButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ checked: number; sent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await fetch('/api/reminders/run-now', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Could not run the reminder check.');
    } else {
      setResult(data);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div>
      <Button type="button" fullWidth={false} className="px-5" onClick={handleRun} loading={loading}>
        Run reminder check now
      </Button>
      {error && <Alert tone="error">{error}</Alert>}
      {result && (
        <p className="text-sm text-forest mt-2">
          Checked {result.checked} active lease{result.checked === 1 ? '' : 's'} — sent {result.sent} reminder
          {result.sent === 1 ? '' : 's'}.
        </p>
      )}
    </div>
  );
}
