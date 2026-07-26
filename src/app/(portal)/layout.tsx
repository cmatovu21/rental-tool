import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { LogoutButton } from '@/components/auth/logout-button';
import { MobileNav } from '@/components/layout/mobile-nav';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'TENANT') {
    redirect('/login');
  }

  const navLinks = [
    { href: '/portal', label: 'Dashboard' },
    { href: '/portal/maintenance', label: 'Maintenance' },
  ];

  return (
    <div className="min-h-screen bg-paper dark:bg-ink">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:rounded focus:shadow">
        Skip to content
      </a>
      <header className="relative border-b border-rule bg-white dark:bg-ink dark:border-white/10">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/portal" className="font-display text-lg font-semibold text-ink dark:text-paper">
            RentLedger
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <nav className="hidden sm:flex items-center gap-5 text-sm text-ink/70 dark:text-paper/70">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-ink dark:hover:text-paper">
                  {link.label}
                </Link>
              ))}
            </nav>
            <span className="hidden md:inline text-sm text-ink/70 dark:text-paper/70">{session.fullName}</span>
            <ThemeToggle />
            <LogoutButton />
            <MobileNav links={navLinks} />
          </div>
        </div>
      </header>
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
