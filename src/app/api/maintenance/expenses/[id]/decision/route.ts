import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { decideExpenseSchema } from '@/lib/validators/maintenance';
import { decideExpense } from '@/server/services/maintenance';

/** Only the Landlord approves/rejects spend — matches the lifecycle spec
 *  ("Owner approves expenses"). */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireRole(await getCurrentUser(), ['LANDLORD']);
    const body = await request.json().catch(() => null);
    const parsed = decideExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const expense = await decideExpense(params.id, parsed.data.decision, session.sub);
    return NextResponse.json({ expense: { ...expense, amount: Number(expense.amount) } });
  } catch (err) {
    return handleApiError(err);
  }
}
