import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({
    user: { id: session.sub, fullName: session.fullName, email: session.email, role: session.role },
  });
}
