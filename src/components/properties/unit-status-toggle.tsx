'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';

const STATUS_LABELS: Record<string, string> = { VACANT: 'Vacant', MAINTENANCE: 'Under maintenance', OCCUPIED: 'Occupied' };
const STATUS_COLORS: Record<string, string> = {
  VACANT: 'bg-ochre/10 text-ochre',
  MAINTENANCE: 'bg-ink/10 text-ink/70',
  OCCUPIED: 'bg-forest-50 text-forest',
};

export function UnitStatusToggle({ unitId, status }: { unitId: string; status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(next: 'VACANT' | 'MAINTENANCE') {
    setUpdating(true);
    setError(null);
    const res = await fetch(`/api/units/${unitId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Could not update status.');
    } else {
      router.refresh();
    }
    setUpdating(false);
  }

  return (
    <div>
      <span className={`inline-block text-xs font-mono uppercase px-2 py-1 rounded ${STATUS_COLORS[status]}`}>
        {STATUS_LABELS[status]}
      </span>
      {error && <Alert tone="error">{error}</Alert>}
      {status === 'OCCUPIED' ? (
        <p className="text-xs text-ink/45 mt-2">Status is set automatically while a lease is active.</p>
      ) : (
        <div className="flex gap-3 mt-2 text-sm">
          {status !== 'VACANT' && (
            <button onClick={() => setStatus('VACANT')} disabled={updating} className="text-forest hover:underline disabled:opacity-50">
              Mark vacant
            </button>
          )}
          {status !== 'MAINTENANCE' && (
            <button onClick={() => setStatus('MAINTENANCE')} disabled={updating} className="text-forest hover:underline disabled:opacity-50">
              Mark under maintenance
            </button>
          )}
        </div>
      )}
    </div>
  );
}
