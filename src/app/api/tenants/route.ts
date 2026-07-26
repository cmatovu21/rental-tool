import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { createTenantSchema } from '@/lib/validators/tenant';
import { createTenant, listTenants } from '@/server/services/tenants';

export async function GET() {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER', 'ACCOUNTANT']);
    const tenants = await listTenants();
    return NextResponse.json({ tenants });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER']);
    const body = await request.json().catch(() => null);
    const parsed = createTenantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const tenant = await createTenant(parsed.data);
    return NextResponse.json({ tenant }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
