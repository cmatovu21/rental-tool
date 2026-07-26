export default function PortalLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="h-8 w-40 bg-rule/60 rounded" />
      <div className="h-32 bg-white border border-rule rounded-lg" />
      <div className="h-20 bg-white border border-rule rounded-lg" />
    </div>
  );
}
