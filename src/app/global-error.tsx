'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#F6F3EC', color: '#1B2420' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ color: '#1B242099', marginBottom: 20, fontSize: 14 }}>
              The app hit an unexpected error. You can try reloading.
            </p>
            <button
              onClick={reset}
              style={{ background: '#1E7A4C', color: 'white', border: 0, borderRadius: 6, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
