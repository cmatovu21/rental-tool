import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { createUnitSchema } from '@/lib/validators/property';
import { createUnit, serializeUnit } from '@/server/services/units';
import { STAFF_WHO_MANAGE_PROPERTIES } from '@/server/services/property-access';

export async function POST(request: Request) {
  try {
    requireRole(await getCurrentUser(), [...STAFF_WHO_MANAGE_PROPERTIES]);
    const body = await request.json().catch(() => null);
    const parsed = createUnitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const unit = await createUnit(parsed.data);
    return NextResponse.json({ unit: serializeUnit(unit) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
