import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { acceptInviteSchema } from '@/lib/validators/auth';
import { hashLookupToken } from '@/lib/auth/tokens';
import { hashPassword } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = acceptInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { token, password } = parsed.data;

  const invalidError = () =>
    NextResponse.json({ error: 'This invite link is invalid, expired, or already used.' }, { status: 400 });

  const tokenHash = hashLookupToken(token);
  const invite = await prisma.invite.findUnique({ where: { tokenHash } });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return invalidError();
  }

  const existingUser = await prisma.user.findFirst({ where: { OR: [{ email: invite.email }, { phone: invite.phone }] } });
  if (existingUser) {
    // Shouldn't normally happen (checked at invite-creation time too), but
    // guards against a race if two invites/registrations land at once.
    return NextResponse.json({ error: 'An account with that email or phone already exists.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        fullName: invite.fullName,
        email: invite.email,
        phone: invite.phone,
        passwordHash,
        role: invite.role,
      },
    });
    await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    await tx.auditLog.create({
      data: { userId: createdUser.id, action: 'ACCEPT_INVITE', entityType: 'user', entityId: createdUser.id },
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
