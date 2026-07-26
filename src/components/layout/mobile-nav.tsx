'use client';

import { useState } from 'react';
import Link from 'next/link';

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="p-2 -mr-2 text-ink"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        )}
      </button>
      {open && (
        <nav className="absolute left-0 right-0 top-16 bg-white border-b border-rule px-6 py-4 flex flex-col gap-3 z-10">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-ink/70 hover:text-ink" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
