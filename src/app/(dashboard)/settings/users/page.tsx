'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface InviteRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export default function StaffUsersPage() {
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', role: 'CARETAKER' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadInvites() {
    setLoadingList(true);
    const res = await fetch('/api/auth/invites');
    if (res.ok) {
      const data = await res.json();
      setInvites(data.invites);
    }
    setLoadingList(false);
  }

  useEffect(() => {
    loadInvites();
  }, []);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      setSuccess(`Invite sent to ${form.email}.`);
      setForm({ fullName: '', email: '', phone: '', role: 'CARETAKER' });
      loadInvites();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink mb-1">Staff & access</h1>
        <p className="text-ink/60 mb-6 text-sm">
          Invite a caretaker, accountant, or co-landlord. They&apos;ll set their own password to activate the account.
        </p>
        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}
        <form onSubmit={handleSubmit} noValidate className="bg-white border border-rule rounded-lg p-6">
          <Field label="Full name" name="fullName" required value={form.fullName} onChange={update('fullName')} />
          <Field
            label="Email"
            type="email"
            name="email"
            required
            value={form.email}
            onChange={update('email')}
          />
          <Field
            label="Phone number"
            type="tel"
            name="phone"
            placeholder="0701234567"
            required
            value={form.phone}
            onChange={update('phone')}
          />
          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium text-ink mb-1.5">
              Role
            </label>
            <select
              id="role"
              className="w-full rounded-md border border-rule bg-white px-3 py-2 text-ink focus:border-forest focus:ring-1 focus:ring-forest"
              value={form.role}
              onChange={update('role')}
            >
              <option value="CARETAKER">Caretaker</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="LANDLORD">Landlord</option>
            </select>
          </div>
          <Button type="submit" loading={submitting}>
            Send invite
          </Button>
        </form>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-ink mb-4">Invites</h2>
        {loadingList ? (
          <p className="text-sm text-ink/50">Loading…</p>
        ) : invites.length === 0 ? (
          <p className="text-sm text-ink/50">No invites yet — send your first one.</p>
        ) : (
          <ul className="space-y-3">
            {invites.map((invite) => {
              const expired = !invite.acceptedAt && new Date(invite.expiresAt) < new Date();
              const status = invite.acceptedAt ? 'Accepted' : expired ? 'Expired' : 'Pending';
              const statusColor =
                status === 'Accepted' ? 'text-forest' : status === 'Expired' ? 'text-red-700' : 'text-ochre';
              return (
                <li key={invite.id} className="bg-white border border-rule rounded-lg px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-ink">{invite.fullName}</p>
                    <p className="text-xs text-ink/50">
                      {invite.email} · {invite.role.toLowerCase()}
                    </p>
                  </div>
                  <span className={`text-xs font-mono uppercase ${statusColor}`}>{status}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
