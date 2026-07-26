import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { terminateLeaseSchema } from '@/lib/validators/tenant';
import { terminateLease } from '@/server/services/leases';

/** The only lease "update" Tenant Module supports is termination — full
 *  lease editing (renewals, amendments) is out of this milestone's scope. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER']);
    const body = await request.json().catch(() => ({}));
    const parsed = terminateLeaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const lease = await terminateLease(params.id, parsed.data.reason);
    return NextResponse.json({ lease: { ...lease, rentAmount: Number(lease.rentAmount), depositAmount: Number(lease.depositAmount) } });
  } catch (err) {
    return handleApiError(err);
  }
}
