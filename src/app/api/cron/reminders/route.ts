import { NextResponse } from 'next/server';
import { runReminderCheck } from '@/server/services/reminders';

/**
 * Meant to be called by an external scheduler (Vercel Cron, a system
 * crontab hitting this URL with curl, etc.) once a day — not by a logged-in
 * user, so it's protected by a shared secret instead of a session cookie.
 * Set CRON_SECRET in .env and configure your scheduler to send it as
 * `Authorization: Bearer <CRON_SECRET>`.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runReminderCheck();
  return NextResponse.json(result);
}
