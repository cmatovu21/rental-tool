'use client';

import { useEffect, useState } from 'react';

interface TabularReport {
  title: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string | number>[];
}

const REPORTS: { value: string; label: string }[] = [
  { value: 'rent-roll', label: 'Rent Roll' },
  { value: 'cash-flow', label: 'Cash Flow' },
  { value: 'income-statement', label: 'Income Statement' },
  { value: 'occupancy', label: 'Occupancy' },
  { value: 'maintenance-costs', label: 'Maintenance Costs' },
  { value: 'outstanding-rent', label: 'Outstanding Rent' },
  { value: 'late-tenants', label: 'Late Tenants' },
  { value: 'revenue-trends', label: 'Revenue Trends' },
];

function formatCell(value: string | number) {
  return typeof value === 'number' ? value.toLocaleString() : value;
}

export function ReportBrowser() {
  const [type, setType] = useState('rent-roll');
  const [report, setReport] = useState<TabularReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/${type}`)
      .then((res) => res.json())
      .then((data) => setReport(data.report ?? null))
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-md border border-rule bg-white px-3 py-2 text-sm"
        >
          {REPORTS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <div className="flex gap-3 text-sm">
          <a href={`/api/reports/${type}/export?format=csv`} className="text-forest hover:underline">
            Export CSV
          </a>
          <a href={`/api/reports/${type}/export?format=xlsx`} className="text-forest hover:underline">
            Export Excel
          </a>
          <a href={`/api/reports/${type}/export?format=pdf`} className="text-forest hover:underline">
            Export PDF
          </a>
        </div>
      </div>

      <div className="bg-white border border-rule rounded-lg overflow-x-auto">
        {loading ? (
          <p className="p-6 text-sm text-ink/50">Loading…</p>
        ) : !report || report.rows.length === 0 ? (
          <p className="p-6 text-sm text-ink/50">No data for this report yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink/50 text-xs uppercase border-b border-rule">
                {report.columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-normal whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {report.rows.map((row, i) => (
                <tr key={i}>
                  {report.columns.map((c) => (
                    <td key={c.key} className="px-4 py-2.5 whitespace-nowrap">
                      {formatCell(row[c.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
