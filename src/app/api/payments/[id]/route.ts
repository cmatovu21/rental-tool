import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { getPaymentDetail } from '@/server/services/payments';
import { toDisplayNumber } from '@/lib/money';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER', 'ACCOUNTANT']);
    const payment = await getPaymentDetail(params.id);
    if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    return NextResponse.json({
      payment: {
        ...payment,
        amount: toDisplayNumber(payment.amount),
        lease: { ...payment.lease, rentAmount: toDisplayNumber(payment.lease.rentAmount), depositAmount: toDisplayNumber(payment.lease.depositAmount) },
        refunds: payment.refunds.map((r) => ({ ...r, amount: toDisplayNumber(r.amount) })),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
