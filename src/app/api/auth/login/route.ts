import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';
import { loginSchema } from '@/lib/validators/auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { email, password } = parsed.data;

  // Same generic error for "no such user" and "wrong password" — never tell
  // an attacker which one it was.
  const genericError = () => NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return genericError();

  if (user.status === 'INACTIVE') {
    return NextResponse.json(
      { error: 'This account has been deactivated. Contact your landlord for access.' },
      { status: 403 }
    );
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) return genericError();

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'LOGIN', entityType: 'user', entityId: user.id },
  });

  const response = NextResponse.json({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
  });
  await setSessionCookie(response, {
    sub: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
  });
  return response;
}
