import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { issueRefundSchema } from '@/lib/validators/payment';
import { issueRefund } from '@/server/services/payments';

/** Refunds are Landlord/Accountant only — a Caretaker can record a payment
 *  but not reverse one. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireRole(await getCurrentUser(), ['LANDLORD', 'ACCOUNTANT']);
    const body = await request.json().catch(() => null);
    const parsed = issueRefundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const refund = await issueRefund(params.id, parsed.data.amount, parsed.data.reason, session.sub);
    return NextResponse.json({ refund: { ...refund, amount: Number(refund.amount) } }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
