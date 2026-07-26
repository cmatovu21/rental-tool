import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { createPropertySchema } from '@/lib/validators/property';
import { createProperty, listProperties } from '@/server/services/properties';
import { STAFF_WHO_MANAGE_PROPERTIES } from '@/server/services/property-access';

export async function GET() {
  try {
    requireRole(await getCurrentUser(), [...STAFF_WHO_MANAGE_PROPERTIES]);
    const properties = await listProperties();
    return NextResponse.json({ properties });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    requireRole(await getCurrentUser(), [...STAFF_WHO_MANAGE_PROPERTIES]);
    const body = await request.json().catch(() => null);
    const parsed = createPropertySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const property = await createProperty(parsed.data);
    return NextResponse.json({ property }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
