'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeletePropertyButton({ propertyId, unitCount }: { propertyId: string; unitCount: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/properties/${propertyId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/properties');
      router.refresh();
      return;
    }
    const data = await res.json();
    setError(data.error ?? 'Could not delete this property.');
    setDeleting(false);
    setConfirming(false);
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="text-sm text-red-700 hover:underline">
        Delete property
      </button>
    );
  }

  return (
    <div className="text-right">
      <p className="text-sm text-ink/70 mb-2 max-w-xs">
        Delete this property{unitCount > 0 ? ` and its ${unitCount} unit${unitCount === 1 ? '' : 's'}` : ''}? This
        can&apos;t be undone.
      </p>
      {error && <p className="text-sm text-red-700 mb-2 max-w-xs">{error}</p>}
      <div className="flex gap-3 justify-end">
        <button onClick={() => setConfirming(false)} className="text-sm text-ink/60 hover:underline">
          Cancel
        </button>
        <button onClick={handleDelete} disabled={deleting} className="text-sm text-red-700 font-medium hover:underline disabled:opacity-50">
          {deleting ? 'Deleting…' : 'Yes, delete it'}
        </button>
      </div>
    </div>
  );
}
