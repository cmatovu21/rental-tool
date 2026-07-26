import { randomBytes, randomInt, createHash } from 'crypto';
import bcrypt from 'bcryptjs';

const SECRET_HASH_ROUNDS = 10;

/** Long, high-entropy token for links sent by email (invite accept, reset link). */
export function generateUrlSafeToken(): string {
  return randomBytes(32).toString('hex');
}

/** Short numeric code for SMS OTP — easy to type on a phone keypad. */
export function generateNumericOtp(digits = 6): string {
  const max = 10 ** digits;
  return randomInt(0, max).toString().padStart(digits, '0');
}

/** Secrets (tokens/OTPs) are always stored hashed, never in plaintext. */
export async function hashSecret(secret: string): Promise<string> {
  return bcrypt.hash(secret, SECRET_HASH_ROUNDS);
}

export async function verifySecret(secret: string, hash: string): Promise<boolean> {
  return bcrypt.compare(secret, hash);
}

/**
 * For tokens that must be looked up directly by value (invite links), where
 * there's no other way to know which row they belong to. bcrypt can't do
 * this (its hash isn't deterministic), so we use a plain SHA-256 digest
 * instead — safe here because the token itself is a 256-bit random value,
 * not a guessable secret like a password, so preimage resistance alone is
 * enough protection if the database were ever leaked.
 */
export function hashLookupToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
