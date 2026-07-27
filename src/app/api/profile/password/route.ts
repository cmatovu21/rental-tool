import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireAnyUser } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { changePasswordSchema } from '@/lib/validators/profile';
import { changeOwnPassword } from '@/server/services/profile';

export async function PATCH(request: Request) {
  try {
    const session = requireAnyUser(await getCurrentUser());
    const body = await request.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    await changeOwnPassword(session.sub, parsed.data.currentPassword, parsed.data.newPassword);
    return NextResponse.json({ message: 'Password updated.' });
  } catch (err) {
    return handleApiError(err);
  }
}
