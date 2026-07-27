import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import type { UpdateProfileInput } from '@/lib/validators/profile';

export async function getOwnProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, email: true, phone: true, role: true },
  });
}

export async function updateOwnProfile(userId: string, input: UpdateProfileInput) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { phone: input.phone }], NOT: { id: userId } },
  });
  if (existing) {
    throw new Error('That email or phone number is already used by another account.');
  }
  return prisma.user.update({
    where: { id: userId },
    data: { fullName: input.fullName, email: input.email, phone: input.phone },
  });
}

export async function changeOwnPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error('Your current password is incorrect.');
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
