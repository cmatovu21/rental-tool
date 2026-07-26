import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Baseline password strength check. Kept intentionally simple for v1 — this
 * is the one place to tighten rules later without touching call sites.
 */
export function isPasswordStrongEnough(plain: string): boolean {
  return plain.length >= 8;
}
