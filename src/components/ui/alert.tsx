export function Alert({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) {
  const styles =
    tone === 'error'
      ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'
      : 'bg-forest-50 text-forest-deep border-forest/30 dark:bg-forest/10 dark:text-forest dark:border-forest/30';
  return (
    <div className={`mb-4 rounded-md border px-3 py-2 text-sm ${styles}`} role="alert">
      {children}
    </div>
  );
}
