import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { listActiveLeasesForPaymentEntry } from '@/server/services/payments';

export async function GET() {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER', 'ACCOUNTANT']);
    const leases = await listActiveLeasesForPaymentEntry();
    return NextResponse.json({ leases });
  } catch (err) {
    return handleApiError(err);
  }
}
