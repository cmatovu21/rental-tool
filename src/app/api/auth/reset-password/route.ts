import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resetPasswordSchema } from '@/lib/validators/auth';
import { verifySecret } from '@/lib/auth/tokens';
import { hashPassword } from '@/lib/auth/password';

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { identifier, secret, newPassword } = parsed.data;

  const invalidError = () =>
    NextResponse.json({ error: 'That code or link is invalid or has expired. Please request a new one.' }, { status: 400 });

  const user = await prisma.user.findFirst({ where: { OR: [{ email: identifier }, { phone: identifier }] } });
  if (!user) return invalidError();

  // Most recent, unused, unexpired request for this user — works for either
  // channel since both store a hashed secret the same way.
  const resetRequest = await prisma.passwordResetRequest.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!resetRequest) return invalidError();

  if (resetRequest.attempts >= MAX_ATTEMPTS) return invalidError();

  const matches = await verifySecret(secret, resetRequest.secretHash);
  if (!matches) {
    await prisma.passwordResetRequest.update({
      where: { id: resetRequest.id },
      data: { attempts: { increment: 1 } },
    });
    return invalidError();
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.passwordResetRequest.update({ where: { id: resetRequest.id }, data: { usedAt: new Date() } }),
    prisma.auditLog.create({
      data: { userId: user.id, action: 'PASSWORD_RESET', entityType: 'user', entityId: user.id },
    }),
  ]);

  return NextResponse.json({ message: 'Your password has been reset. You can now log in.' });
}
