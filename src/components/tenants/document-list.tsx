'use client';

import { useRef, useState } from 'react';
import { Alert } from '@/components/ui/alert';

interface TenantDocument {
  id: string;
  docType: string;
  fileUrl: string;
  uploadedAt: string;
}

const DOC_TYPES = ['national_id', 'signed_lease', 'passport_photo', 'other'];

export function DocumentList({ tenantId, initialDocuments }: { tenantId: string; initialDocuments: TenantDocument[] }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [docType, setDocType] = useState('national_id');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);
      const res = await fetch(`/api/tenants/${tenantId}/documents`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Upload failed.');
        return;
      }
      setDocuments((prev) => [data.document, ...prev]);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(id: string) {
    const previous = documents;
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Could not delete that document.');
      setDocuments(previous);
    }
  }

  return (
    <div className="bg-white border border-rule rounded-lg p-5">
      <h3 className="font-display text-base font-semibold text-ink mb-4">Documents</h3>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex items-center gap-3 mb-4">
        <select value={docType} onChange={(e) => setDocType(e.target.value)} className="rounded-md border border-rule bg-white px-2 py-1.5 text-sm">
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <label className="text-sm text-forest hover:underline cursor-pointer">
          {uploading ? 'Uploading…' : '+ Upload'}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      {documents.length === 0 ? (
        <p className="text-sm text-ink/50">No documents uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {documents.map((d) => (
            <li key={d.id} className="py-2.5 flex items-center justify-between">
              <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-forest hover:underline">
                {d.docType.replace(/_/g, ' ')}
              </a>
              <button onClick={() => handleDelete(d.id)} className="text-xs text-ink/40 hover:text-red-700">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
