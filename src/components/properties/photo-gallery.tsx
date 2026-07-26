'use client';

import { useRef, useState } from 'react';
import { Alert } from '@/components/ui/alert';

interface Photo {
  id: string;
  url: string;
  caption: string | null;
}

export function PhotoGallery({
  uploadUrl,
  initialPhotos,
}: {
  uploadUrl: string;
  initialPhotos: Photo[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
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
      const res = await fetch(uploadUrl, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Upload failed.');
        return;
      }
      setPhotos((prev) => [data.photo, ...prev]);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(photoId: string) {
    const previous = photos;
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Could not delete that photo.');
      setPhotos(previous);
    }
  }

  return (
    <div className="bg-white border border-rule rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-semibold text-ink">Photos</h3>
        <label className="text-sm text-forest hover:underline cursor-pointer">
          {uploading ? 'Uploading…' : '+ Add photo'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {photos.length === 0 ? (
        <p className="text-sm text-ink/50">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group rounded-md overflow-hidden border border-rule aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                className="absolute top-1 right-1 bg-white/90 text-ink text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
