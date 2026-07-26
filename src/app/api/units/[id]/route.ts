import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { updateUnitSchema } from '@/lib/validators/property';
import { getUnitDetail, serializeUnit, updateUnit } from '@/server/services/units';
import { STAFF_WHO_MANAGE_PROPERTIES } from '@/server/services/property-access';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), [...STAFF_WHO_MANAGE_PROPERTIES]);
    const unit = await getUnitDetail(params.id);
    if (!unit) return NextResponse.json({ error: 'Unit not found.' }, { status: 404 });
    return NextResponse.json({ unit: serializeUnit(unit) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), [...STAFF_WHO_MANAGE_PROPERTIES]);
    const body = await request.json().catch(() => null);
    const parsed = updateUnitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const unit = await updateUnit(params.id, parsed.data);
    return NextResponse.json({ unit: serializeUnit(unit) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), [...STAFF_WHO_MANAGE_PROPERTIES]);
    const activeLease = await prisma.lease.findFirst({ where: { unitId: params.id, status: 'ACTIVE' } });
    if (activeLease) {
      return NextResponse.json({ error: 'This unit has an active lease and cannot be deleted.' }, { status: 409 });
    }
    await prisma.unit.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
