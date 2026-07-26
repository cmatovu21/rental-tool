import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { updateReminderTemplate } from '@/server/services/reminders';

const schema = z.object({ messageBody: z.string().trim().min(5), isActive: z.boolean() });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD']);
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const template = await updateReminderTemplate(params.id, parsed.data.messageBody, parsed.data.isActive);
    return NextResponse.json({ template });
  } catch (err) {
    return handleApiError(err);
  }
}
