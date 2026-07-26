'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'CLOSED'];

export function TicketStatusControl({ ticketId, status }: { ticketId: string; status: string }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function handleChange(next: string) {
    setUpdating(true);
    await fetch(`/api/maintenance/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    router.refresh();
    setUpdating(false);
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={updating}
      className="rounded-md border border-rule bg-white px-3 py-1.5 text-sm"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace('_', ' ')}
        </option>
      ))}
    </select>
  );
}
