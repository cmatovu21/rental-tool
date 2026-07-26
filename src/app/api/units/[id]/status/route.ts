import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { unitStatusSchema } from '@/lib/validators/property';
import { serializeUnit, setUnitStatus } from '@/server/services/units';
import { STAFF_WHO_MANAGE_PROPERTIES } from '@/server/services/property-access';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), [...STAFF_WHO_MANAGE_PROPERTIES]);
    const body = await request.json().catch(() => null);
    const parsed = unitStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const unit = await setUnitStatus(params.id, parsed.data.status);
    return NextResponse.json({ unit: serializeUnit(unit) });
  } catch (err) {
    return handleApiError(err);
  }
}
