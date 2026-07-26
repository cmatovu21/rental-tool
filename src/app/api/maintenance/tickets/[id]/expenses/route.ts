import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { createExpenseSchema } from '@/lib/validators/maintenance';
import { addExpense } from '@/server/services/maintenance';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER']);
    const body = await request.json().catch(() => null);
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const expense = await addExpense(params.id, parsed.data);
    return NextResponse.json({ expense: { ...expense, amount: Number(expense.amount) } }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
