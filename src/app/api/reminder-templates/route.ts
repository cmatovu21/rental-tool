import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { listReminderTemplates } from '@/server/services/reminders';

export async function GET() {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'CARETAKER', 'ACCOUNTANT']);
    const templates = await listReminderTemplates();
    return NextResponse.json({ templates });
  } catch (err) {
    return handleApiError(err);
  }
}
