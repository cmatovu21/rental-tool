export function KpiCard({
  label,
  value,
  tone = 'default',
  caption,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'warning';
  caption?: string;
}) {
  const valueColor = tone === 'positive' ? 'text-forest' : tone === 'warning' ? 'text-ochre' : 'text-ink';
  return (
    <div className="bg-white border border-rule rounded-lg px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-ink/50 mb-2">{label}</p>
      <p className={`font-mono text-2xl font-medium ${valueColor}`}>{value}</p>
      {caption && <p className="text-xs text-ink/45 mt-1">{caption}</p>}
    </div>
  );
}
