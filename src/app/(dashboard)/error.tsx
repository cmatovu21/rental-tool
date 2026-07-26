'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-white border border-rule rounded-lg p-8 text-center max-w-md mx-auto mt-12">
      <h2 className="font-display text-lg font-semibold text-ink mb-2">Something went wrong</h2>
      <p className="text-sm text-ink/60 mb-6">
        This page hit an unexpected error. It's been logged — try again, or head back to the dashboard.
      </p>
      <div className="flex gap-3 justify-center">
        <Button type="button" fullWidth={false} className="px-5" onClick={reset}>
          Try again
        </Button>
        <a href="/dashboard" className="text-sm text-forest hover:underline self-center">
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
