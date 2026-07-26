export default function DashboardLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 bg-rule/60 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-white border border-rule rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-white border border-rule rounded-lg" />
    </div>
  );
}
