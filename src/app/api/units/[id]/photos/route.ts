import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { saveUploadedImage } from '@/lib/storage';
import { attachPhoto, listPhotos } from '@/server/services/photos';
import { STAFF_WHO_MANAGE_PROPERTIES } from '@/server/services/property-access';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), [...STAFF_WHO_MANAGE_PROPERTIES]);
    const photos = await listPhotos('unit', params.id);
    return NextResponse.json({ photos });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), [...STAFF_WHO_MANAGE_PROPERTIES]);
    const formData = await request.formData();
    const file = formData.get('file');
    const caption = formData.get('caption');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file was uploaded.' }, { status: 400 });
    }
    const url = await saveUploadedImage(file, 'units');
    const photo = await attachPhoto('unit', params.id, url, typeof caption === 'string' ? caption : undefined);
    return NextResponse.json({ photo }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
