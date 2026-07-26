import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { createInspectionSchema } from '@/lib/validators/tenant';
import { createInspection } from '@/server/services/inspections';

export async function POST(request: Request) {
  try {
    const session = requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER']);
    const body = await request.json().catch(() => null);
    const parsed = createInspectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const inspection = await createInspection(parsed.data, session.sub);
    return NextResponse.json({ inspection }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
