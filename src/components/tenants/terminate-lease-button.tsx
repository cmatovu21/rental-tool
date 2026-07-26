'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function TerminateLeaseButton({ leaseId }: { leaseId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTerminate() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/leases/${leaseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Lease terminated via Tenant Module' }),
    });
    if (res.ok) {
      router.refresh();
      setConfirming(false);
    } else {
      const data = await res.json();
      setError(data.error ?? 'Could not terminate this lease.');
    }
    setLoading(false);
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="text-sm text-red-700 hover:underline">
        End lease
      </button>
    );
  }

  return (
    <div>
      <p className="text-sm text-ink/70 mb-2">
        End this lease? The unit will become vacant and the deposit will need to be reconciled (Payment Module).
      </p>
      {error && <p className="text-sm text-red-700 mb-2">{error}</p>}
      <div className="flex gap-3">
        <button onClick={() => setConfirming(false)} className="text-sm text-ink/60 hover:underline">
          Cancel
        </button>
        <button onClick={handleTerminate} disabled={loading} className="text-sm text-red-700 font-medium hover:underline disabled:opacity-50">
          {loading ? 'Ending…' : 'Yes, end lease'}
        </button>
      </div>
    </div>
  );
}
