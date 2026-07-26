import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { completeInspectionSchema } from '@/lib/validators/tenant';
import { completeInspection } from '@/server/services/inspections';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER']);
    const body = await request.json().catch(() => null);
    const parsed = completeInspectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const inspection = await completeInspection(params.id, parsed.data.conditionNotes);
    return NextResponse.json({ inspection });
  } catch (err) {
    return handleApiError(err);
  }
}
