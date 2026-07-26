import { SignJWT, jwtVerify } from 'jose';

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET is missing or too short. Set a random string of at least 32 characters in your .env file.'
    );
  }
  return new TextEncoder().encode(secret);
}

export type UserRole = 'LANDLORD' | 'CARETAKER' | 'ACCOUNTANT' | 'TENANT';

export interface SessionPayload {
  sub: string; // user id
  role: UserRole;
  email: string;
  fullName: string;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.sub === 'string' &&
      typeof payload.role === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.fullName === 'string'
    ) {
      return {
        sub: payload.sub,
        role: payload.role as UserRole,
        email: payload.email,
        fullName: payload.fullName,
      };
    }
    return null;
  } catch {
    // Expired, malformed, or tampered token — treat all as "not signed in".
    return null;
  }
}

export const SESSION_COOKIE_NAME = 'session';
export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_SECONDS;
