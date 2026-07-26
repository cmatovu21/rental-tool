import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { updateTenantSchema } from '@/lib/validators/tenant';
import { getTenantProfile, updateTenant } from '@/server/services/tenants';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER', 'ACCOUNTANT']);
    const profile = await getTenantProfile(params.id);
    if (!profile) return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    return NextResponse.json(profile);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER']);
    const body = await request.json().catch(() => null);
    const parsed = updateTenantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const tenant = await updateTenant(params.id, parsed.data);
    return NextResponse.json({ tenant });
  } catch (err) {
    return handleApiError(err);
  }
}
