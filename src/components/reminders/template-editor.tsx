'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface Template {
  id: string;
  name: string;
  channel: string;
  triggerType: string;
  messageBody: string;
  isActive: boolean;
}

export function TemplateEditor({ template }: { template: Template }) {
  const router = useRouter();
  const [messageBody, setMessageBody] = useState(template.messageBody);
  const [isActive, setIsActive] = useState(template.isActive);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/reminder-templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageBody, isActive }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Could not save this template.');
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <details className="bg-white border border-rule rounded-lg p-4">
      <summary className="flex items-center justify-between cursor-pointer">
        <span className="text-sm font-medium text-ink">
          {template.name} <span className="text-ink/40 font-mono text-xs uppercase">· {template.channel}</span>
        </span>
        <span className={`text-xs font-mono uppercase ${template.isActive ? 'text-forest' : 'text-ink/40'}`}>
          {template.isActive ? 'active' : 'inactive'}
        </span>
      </summary>
      <form onSubmit={handleSubmit} noValidate className="mt-4">
        {error && <Alert tone="error">{error}</Alert>}
        <textarea
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-rule bg-white px-3 py-2 text-sm mb-2"
        />
        <p className="text-xs text-ink/45 mb-3">Placeholders: {'{{tenant_name}}'}, {'{{amount}}'}, {'{{due_date}}'}, {'{{unit}}'}</p>
        <label className="flex items-center gap-2 text-sm mb-3">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-forest" />
          Active
        </label>
        <Button type="submit" loading={loading} fullWidth={false} className="px-4">
          Save
        </Button>
      </form>
    </details>
  );
}
