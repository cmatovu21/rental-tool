'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export function NewTicketForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/maintenance/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      router.push('/portal/maintenance');
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white border border-rule rounded-lg p-6 max-w-xl">
      {error && <Alert tone="error">{error}</Alert>}
      <Field label="What's the issue?" name="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-ink mb-1.5">
          Details
        </label>
        <textarea
          id="description"
          rows={4}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-rule bg-white px-3 py-2 text-ink focus:border-forest focus:ring-1 focus:ring-forest"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="priority" className="block text-sm font-medium text-ink mb-1.5">
          How urgent is this?
        </label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full rounded-md border border-rule bg-white px-3 py-2 text-ink focus:border-forest focus:ring-1 focus:ring-forest"
        >
          <option value="LOW">Low — whenever convenient</option>
          <option value="MEDIUM">Medium — within a few days</option>
          <option value="HIGH">High — needs attention soon</option>
          <option value="URGENT">Urgent — safety/health issue</option>
        </select>
      </div>
      <Button type="submit" loading={loading}>
        Submit request
      </Button>
    </form>
  );
}
