import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { getLeaseLedger } from '@/server/services/ledger';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER', 'ACCOUNTANT']);
    const ledger = await getLeaseLedger(params.id);
    return NextResponse.json(ledger);
  } catch (err) {
    return handleApiError(err);
  }
}
