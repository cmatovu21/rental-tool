import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { updateTicketStatusSchema } from '@/lib/validators/maintenance';
import { getTicketDetail, updateTicketStatus } from '@/server/services/maintenance';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER', 'ACCOUNTANT']);
    const ticket = await getTicketDetail(params.id);
    if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    return NextResponse.json({
      ticket: { ...ticket, expenses: ticket.expenses.map((e) => ({ ...e, amount: Number(e.amount) })) },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER']);
    const body = await request.json().catch(() => null);
    const parsed = updateTicketStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const ticket = await updateTicketStatus(params.id, parsed.data.status);
    return NextResponse.json({ ticket });
  } catch (err) {
    return handleApiError(err);
  }
}
