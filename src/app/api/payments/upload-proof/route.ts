import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { saveUploadedImage } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER', 'ACCOUNTANT']);
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file was uploaded.' }, { status: 400 });
    }
    const url = await saveUploadedImage(file, 'payment-proofs');
    return NextResponse.json({ url });
  } catch (err) {
    return handleApiError(err);
  }
}
