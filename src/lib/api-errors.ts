import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '@/lib/auth/rbac';
import { UploadError } from '@/lib/storage';

export function handleApiError(err: unknown) {
  if (err instanceof UnauthorizedError) return NextResponse.json({ error: err.message }, { status: 401 });
  if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 });
  if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'That value is already in use.' }, { status: 409 });
    }
    if (err.code === 'P2003' || err.code === 'P2014') {
      return NextResponse.json(
        { error: 'This can\'t be deleted because other records (leases, tickets, payments) still reference it.' },
        { status: 409 }
      );
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }
  }

  if (err instanceof Error) {
    // Deliberate, user-facing errors thrown by our own service functions
    // (e.g. "unit has an active lease") — safe to show as-is.
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  console.error(err);
  return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
}
