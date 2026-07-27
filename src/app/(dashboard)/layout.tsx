import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { LogoutButton } from '@/components/auth/logout-button';
import { MobileNav } from '@/components/layout/mobile-nav';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  // Middleware already guards this route group; this is a defense-in-depth
  // check, not the primary gate — never rely on a layout alone for access control.
  if (!session || !['LANDLORD', 'CARETAKER', 'ACCOUNTANT'].includes(session.role)) {
    redirect('/login');
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    ...(session.role === 'LANDLORD' || session.role === 'CARETAKER' ? [{ href: '/properties', label: 'Properties' }] : []),
    { href: '/tenants', label: 'Tenants' },
    { href: '/payments', label: 'Payments' },
    { href: '/reminders', label: 'Reminders' },
    { href: '/maintenance', label: 'Maintenance' },
    ...(session.role === 'LANDLORD' || session.role === 'ACCOUNTANT' ? [{ href: '/reports', label: 'Reports' }] : []),
    ...(session.role === 'LANDLORD' ? [{ href: '/settings/users', label: 'Staff & Access' }] : []),
    { href: '/profile', label: 'My Profile' },
  ];

  return (
    <div className="min-h-screen bg-paper dark:bg-ink dark:text-paper">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:rounded focus:shadow">
        Skip to content
      </a>
      <header className="relative border-b border-rule bg-white dark:bg-ink dark:border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-lg font-semibold text-ink dark:text-paper">
            RentLedger
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <nav className="hidden sm:flex items-center gap-5 text-sm text-ink/70 dark:text-paper/70">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-ink dark:hover:text-paper">
                  {link.label}
                </Link>
              ))}
            </nav>
            <span className="hidden sm:inline text-xs font-mono uppercase tracking-wide text-forest bg-forest-50 dark:bg-white/10 px-2 py-1 rounded">
              {session.role}
            </span>
            <Link href="/profile" className="hidden md:inline text-sm text-ink/70 dark:text-paper/70 hover:text-ink dark:hover:text-paper hover:underline">
              {session.fullName}
            </Link>
            <ThemeToggle />
            <LogoutButton />
            <MobileNav links={navLinks} />
          </div>
        </div>
      </header>
      <main id="main-content" className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
