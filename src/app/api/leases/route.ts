import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { createLeaseSchema } from '@/lib/validators/tenant';
import { createLease } from '@/server/services/leases';

export async function POST(request: Request) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER']);
    const body = await request.json().catch(() => null);
    const parsed = createLeaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const lease = await createLease(parsed.data);
    return NextResponse.json({ lease: { ...lease, rentAmount: Number(lease.rentAmount), depositAmount: Number(lease.depositAmount) } }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
