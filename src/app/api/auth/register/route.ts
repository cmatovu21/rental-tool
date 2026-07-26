import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';
import { registerSchema } from '@/lib/validators/auth';

/**
 * Tenant self-registration — open to anyone (per project decision: no
 * matching against an existing Tenant record). This always creates BOTH a
 * User (role TENANT) and a fresh Tenant profile row, status PROSPECTIVE.
 * Staff roles never register here — they're invited (see /api/auth/invites).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { fullName, email, phone, password } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) {
    return NextResponse.json(
      { error: 'An account with that email or phone number already exists.' },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: { fullName, email, phone, passwordHash, role: 'TENANT' },
    });
    await tx.tenant.create({
      data: {
        userId: createdUser.id,
        fullName,
        phone,
        email,
        status: 'PROSPECTIVE',
      },
    });
    await tx.auditLog.create({
      data: { userId: createdUser.id, action: 'REGISTER', entityType: 'user', entityId: createdUser.id },
    });
    return createdUser;
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
