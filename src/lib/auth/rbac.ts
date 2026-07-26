import type { SessionPayload, UserRole } from './jwt';

export class UnauthorizedError extends Error {
  constructor(message = 'You must be signed in to do that.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Throws if there's no session, or if the session's role isn't in the
 * allowed list. Call this at the top of every API route / server action
 * that isn't meant to be public — never rely on the UI hiding a button as
 * the only access control.
 */
export function requireRole(session: SessionPayload | null, allowedRoles: UserRole[]): SessionPayload {
  if (!session) throw new UnauthorizedError();
  if (!allowedRoles.includes(session.role)) throw new ForbiddenError();
  return session;
}

export function requireAnyUser(session: SessionPayload | null): SessionPayload {
  if (!session) throw new UnauthorizedError();
  return session;
}
