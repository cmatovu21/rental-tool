import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { listReminderLog } from '@/server/services/reminders';

export async function GET() {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER', 'ACCOUNTANT']);
    const reminders = await listReminderLog();
    return NextResponse.json({ reminders });
  } catch (err) {
    return handleApiError(err);
  }
}
