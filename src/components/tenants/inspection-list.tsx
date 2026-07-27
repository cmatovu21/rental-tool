'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface Inspection {
  id: string;
  type: string;
  status: string;
  conditionNotes: string | null;
  createdAt: Date;
}

export function InspectionList({ leaseId, inspections }: { leaseId: string | null; inspections: Inspection[] }) {
  const router = useRouter();
  const [type, setType] = useState('ROUTINE');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!leaseId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseId, type, conditionNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      setNotes('');
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-rule rounded-lg p-5">
      <h3 className="font-display text-base font-semibold text-ink mb-4">Inspection history</h3>
      {inspections.length === 0 ? (
        <p className="text-sm text-ink/50 mb-4">No inspections recorded yet.</p>
      ) : (
        <ul className="divide-y divide-rule mb-4">
          {inspections.map((i) => (
            <li key={i.id} className="py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{i.type.replace('_', '-').toLowerCase()}</span>
                <span className="text-xs text-ink/45">{new Date(i.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
              {i.conditionNotes && <p className="text-xs text-ink/50 mt-1">{i.conditionNotes}</p>}
            </li>
          ))}
        </ul>
      )}
      {leaseId && (
        <details>
          <summary className="text-sm text-forest hover:underline cursor-pointer">+ Log an inspection</summary>
          <form onSubmit={handleSubmit} noValidate className="mt-4">
            {error && <Alert tone="error">{error}</Alert>}
            <div className="mb-3">
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-md border border-rule bg-white px-3 py-2 text-sm">
                <option value="ROUTINE">Routine</option>
                <option value="MOVE_IN">Move-in</option>
                <option value="MOVE_OUT">Move-out</option>
              </select>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condition notes"
              rows={2}
              className="w-full rounded-md border border-rule bg-white px-3 py-2 text-sm mb-3"
            />
            <Button type="submit" loading={loading}>
              Save inspection
            </Button>
          </form>
        </details>
      )}
    </div>
  );
}
