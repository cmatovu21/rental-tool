import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class UploadError extends Error {}

/**
 * Saves an uploaded image and returns its public URL. Writes to
 * `public/uploads/<folder>/` on local disk for now — this sandbox has no
 * network access to test a real object-storage provider (DigitalOcean
 * Spaces / S3) against, and local disk is genuinely functional once you're
 * running this yourself. Swap the body of this function for an S3-compatible
 * `PutObject` call later; every call site (property/unit photo upload)
 * stays the same since they only depend on getting a URL back.
 */
export async function saveUploadedImage(file: File, folder: 'properties' | 'units' | 'maintenance' | 'inspections' | 'payment-proofs'): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError('Only JPEG, PNG, or WEBP images are allowed.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError('Image must be smaller than 8MB.');
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads', folder);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/${folder}/${filename}`;
}

const ALLOWED_DOC_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

/** Like saveUploadedImage but also accepts PDFs — used for tenant documents (ID copies, signed leases). */
export async function saveUploadedDocument(file: File, folder: 'tenant-documents'): Promise<string> {
  if (!ALLOWED_DOC_TYPES.has(file.type)) {
    throw new UploadError('Only JPEG, PNG, WEBP, or PDF files are allowed.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError('File must be smaller than 8MB.');
  }
  const extMap: Record<string, string> = {
    'image/png': 'png',
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'application/pdf': 'pdf',
  };
  const filename = `${randomUUID()}.${extMap[file.type]}`;
  const dir = path.join(process.cwd(), 'public', 'uploads', folder);
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}
