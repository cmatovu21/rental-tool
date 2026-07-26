import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole, requireAnyUser } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { createTicketSchema } from '@/lib/validators/maintenance';
import { createTicketAsTenant, getTenantActiveUnit, listTicketsForStaff, listTicketsForTenant } from '@/server/services/maintenance';

export async function GET() {
  try {
    const session = requireAnyUser(await getCurrentUser());
    if (session.role === 'TENANT') {
      const tickets = await listTicketsForTenant(session.sub);
      return NextResponse.json({ tickets });
    }
    requireRole(session, ['LANDLORD', 'CARETAKER', 'ACCOUNTANT']);
    const tickets = await listTicketsForStaff();
    return NextResponse.json({ tickets });
  } catch (err) {
    return handleApiError(err);
  }
}

/** Only tenants create tickets this way — for staff creating one on a
 *  tenant's behalf, see the future Property/Unit-scoped ticket creation
 *  (out of this milestone's scope; the tenant portal is the primary path). */
export async function POST(request: Request) {
  try {
    const session = requireRole(await getCurrentUser(), ['TENANT']);
    const body = await request.json().catch(() => null);
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const activeUnit = await getTenantActiveUnit(session.sub);
    if (!activeUnit) {
      return NextResponse.json({ error: 'You need an active lease to submit a maintenance request.' }, { status: 400 });
    }
    const ticket = await createTicketAsTenant(session.sub, activeUnit.unit.id, parsed.data);
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
