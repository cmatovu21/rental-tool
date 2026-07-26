import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { updatePropertySchema } from '@/lib/validators/property';
import { deleteProperty, getPropertyDetail, updateProperty } from '@/server/services/properties';
import { serializeUnit } from '@/server/services/units';
import { STAFF_WHO_MANAGE_PROPERTIES } from '@/server/services/property-access';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), [...STAFF_WHO_MANAGE_PROPERTIES]);
    const property = await getPropertyDetail(params.id);
    if (!property) return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    return NextResponse.json({ property: { ...property, units: property.units.map(serializeUnit) } });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), [...STAFF_WHO_MANAGE_PROPERTIES]);
    const body = await request.json().catch(() => null);
    const parsed = updatePropertySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const property = await updateProperty(params.id, parsed.data);
    return NextResponse.json({ property });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD']); // deleting a whole property is Landlord-only
    await deleteProperty(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
