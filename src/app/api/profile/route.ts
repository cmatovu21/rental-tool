import { NextResponse } from 'next/server';
import { getCurrentUser, setSessionCookie } from '@/lib/auth/session';
import { requireAnyUser } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { updateProfileSchema } from '@/lib/validators/profile';
import { getOwnProfile, updateOwnProfile } from '@/server/services/profile';

export async function GET() {
  try {
    const session = requireAnyUser(await getCurrentUser());
    const profile = await getOwnProfile(session.sub);
    return NextResponse.json({ profile });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = requireAnyUser(await getCurrentUser());
    const body = await request.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const user = await updateOwnProfile(session.sub, parsed.data);

    // The session cookie carries fullName/email so the header/greeting can
    // show them without a DB round trip on every request — re-issue it here
    // so a name/email change is reflected immediately, not just after the
    // next login.
    const response = NextResponse.json({
      profile: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role },
    });
    await setSessionCookie(response, {
      sub: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
    });
    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
