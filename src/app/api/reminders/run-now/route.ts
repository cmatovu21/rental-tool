import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { runReminderCheck } from '@/server/services/reminders';

/** Manual trigger from the dashboard UI, for demoing/testing without
 *  waiting for the external scheduler. Session-authenticated, Landlord-only. */
export async function POST() {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD']);
    const result = await runReminderCheck();
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
