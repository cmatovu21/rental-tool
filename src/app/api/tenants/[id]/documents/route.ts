import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { saveUploadedDocument } from '@/lib/storage';
import { prisma } from '@/lib/db';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER']);
    const formData = await request.formData();
    const file = formData.get('file');
    const docType = formData.get('docType');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file was uploaded.' }, { status: 400 });
    }
    const fileUrl = await saveUploadedDocument(file, 'tenant-documents');
    const document = await prisma.tenantDocument.create({
      data: { tenantId: params.id, fileUrl, docType: typeof docType === 'string' && docType ? docType : 'other' },
    });
    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
