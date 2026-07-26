import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireAnyUser } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { saveUploadedImage } from '@/lib/storage';
import { attachPhoto, listPhotos } from '@/server/services/photos';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireAnyUser(await getCurrentUser());
    const photos = await listPhotos('maintenance_ticket', params.id);
    return NextResponse.json({ photos });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    requireAnyUser(await getCurrentUser());
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file was uploaded.' }, { status: 400 });
    }
    const url = await saveUploadedImage(file, 'maintenance');
    const photo = await attachPhoto('maintenance_ticket', params.id, url);
    return NextResponse.json({ photo }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
