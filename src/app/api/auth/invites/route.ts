import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { ForbiddenError, requireRole, UnauthorizedError } from '@/lib/auth/rbac';
import { createInviteSchema } from '@/lib/validators/auth';
import { generateUrlSafeToken, hashLookupToken } from '@/lib/auth/tokens';
import { sendEmail } from '@/lib/notifications/email';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function errorResponse(err: unknown) {
  if (err instanceof UnauthorizedError) return NextResponse.json({ error: err.message }, { status: 401 });
  if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 });
  console.error(err);
  return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
}

/** Landlord invites a Caretaker/Accountant/(co-)Landlord. Staff never self-register. */
export async function POST(request: Request) {
  try {
    const session = requireRole(await getCurrentUser(), ['LANDLORD']);

    const body = await request.json().catch(() => null);
    const parsed = createInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const { fullName, email, phone, role } = parsed.data;

    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
    if (existingUser) {
      return NextResponse.json({ error: 'A user with that email or phone already exists.' }, { status: 409 });
    }

    const token = generateUrlSafeToken();
    const tokenHash = hashLookupToken(token);

    const invite = await prisma.invite.create({
      data: {
        email,
        phone,
        fullName,
        role,
        tokenHash,
        invitedById: session.sub,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });

    const acceptUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/accept-invite?token=${token}`;
    await sendEmail({
      to: email,
      subject: "You've been invited to Rental Management",
      body: `Hi ${fullName},\n\nYou've been invited as a ${role.toLowerCase()}. Set your password to activate your account (link expires in 7 days):\n\n${acceptUrl}`,
    });

    return NextResponse.json({ invite: { id: invite.id, email: invite.email, role: invite.role } }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Landlord's view of pending/accepted invites. */
export async function GET() {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD']);
    const invites = await prisma.invite.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, fullName: true, role: true, expiresAt: true, acceptedAt: true, createdAt: true },
    });
    return NextResponse.json({ invites });
  } catch (err) {
    return errorResponse(err);
  }
}
