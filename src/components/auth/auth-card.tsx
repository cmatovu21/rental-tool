import type { ReactNode } from 'react';

/**
 * Signature element: every auth screen sits inside a card shaped like a
 * torn-off rent receipt — a perforated top edge and a rotated "stamp" badge
 * bearing the product name, echoing the paper trail (leases, receipts,
 * ledgers) the whole app is built around. Everything else stays quiet:
 * plain labels, one accent color, no decoration beyond this one idea.
 */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="rotate-[-4deg] border-2 border-ochre text-ochre px-4 py-1.5 rounded-sm font-mono text-xs tracking-widest uppercase">
            RentLedger
          </div>
        </div>

        <div className="relative bg-white rounded-lg shadow-sm border border-rule">
          {/* Perforated tear-off edge */}
          <div
            aria-hidden
            className="absolute -top-2 left-0 right-0 h-4 bg-paper"
            style={{
              maskImage:
                'radial-gradient(circle 5px at 12px 0, transparent 5px, black 5.5px)',
              maskSize: '24px 100%',
              maskRepeat: 'repeat-x',
              WebkitMaskImage:
                'radial-gradient(circle 5px at 12px 0, transparent 5px, black 5.5px)',
              WebkitMaskSize: '24px 100%',
              WebkitMaskRepeat: 'repeat-x',
            }}
          />
          <div className="px-8 pt-8 pb-8">
            <h1 className="font-display text-2xl font-semibold text-ink mb-1">{title}</h1>
            {subtitle && <p className="text-sm text-ink/60 mb-6">{subtitle}</p>}
            {!subtitle && <div className="mb-4" />}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
