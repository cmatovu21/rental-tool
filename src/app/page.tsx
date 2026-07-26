import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

export default async function RootPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');
  redirect(session.role === 'TENANT' ? '/portal' : '/dashboard');
}
