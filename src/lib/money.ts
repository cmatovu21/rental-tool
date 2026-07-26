/**
 * Every money column in the database is a Postgres BIGINT (whole UGX, no
 * subunits). Prisma maps that to JS `bigint`. This is the one place that
 * converts to `number` for display/charting — safe because no realistic
 * single portfolio's totals approach Number.MAX_SAFE_INTEGER (9 quadrillion
 * UGX), but every conversion happens here so it's easy to audit or change.
 */

const formatter = new Intl.NumberFormat('en-UG', {
  style: 'currency',
  currency: 'UGX',
  maximumFractionDigits: 0,
});

export function toDisplayNumber(amount: bigint | number | null | undefined): number {
  if (amount === null || amount === undefined) return 0;
  return typeof amount === 'bigint' ? Number(amount) : amount;
}

export function formatUgx(amount: bigint | number | null | undefined): string {
  return formatter.format(toDisplayNumber(amount));
}

/** Compact form for chart axes/labels, e.g. "1.8M" instead of "UGX 1,800,000". */
export function formatCompactUgx(amount: bigint | number | null | undefined): string {
  const n = toDisplayNumber(amount);
  return new Intl.NumberFormat('en-UG', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}
