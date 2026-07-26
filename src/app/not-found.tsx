import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-ochre mb-2">404</p>
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">Page not found</h1>
        <p className="text-ink/60 mb-6">The page you're looking for doesn't exist or may have moved.</p>
        <Link href="/" className="text-forest hover:underline">
          ← Back home
        </Link>
      </div>
    </div>
  );
}
