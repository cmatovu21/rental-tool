import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { prisma } from '@/lib/db';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER']);
    await prisma.tenantDocument.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
