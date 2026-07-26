import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { deletePhoto } from '@/server/services/photos';
import { STAFF_WHO_MANAGE_PROPERTIES } from '@/server/services/property-access';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), [...STAFF_WHO_MANAGE_PROPERTIES]);
    await deletePhoto(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
