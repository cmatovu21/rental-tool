import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { recordPaymentSchema } from '@/lib/validators/payment';
import { listPayments, recordPayment } from '@/server/services/payments';

const STAFF_WHO_RECORD_PAYMENTS = ['LANDLORD', 'CARETAKER', 'ACCOUNTANT'] as const;

export async function GET() {
  try {
    requireRole(await getCurrentUser(), [...STAFF_WHO_RECORD_PAYMENTS]);
    const payments = await listPayments();
    return NextResponse.json({ payments });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const session = requireRole(await getCurrentUser(), STAFF_WHO_RECORD_PAYMENTS);
    const body = await request.json().catch(() => null);
    const parsed = recordPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const { payment, receipt } = await recordPayment(parsed.data, session.sub);
    return NextResponse.json(
      { payment: { ...payment, amount: Number(payment.amount) }, receipt },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
