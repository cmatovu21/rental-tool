'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCompactUgx, formatUgx } from '@/lib/money';

export function RevenueTrendChart({ data }: { data: { month: string; collected: number }[] }) {
  return (
    <div className="bg-white border border-rule rounded-lg p-5">
      <h3 className="font-display text-base font-semibold text-ink mb-4">Revenue trend</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D8D2C4" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#1B242099' }} axisLine={{ stroke: '#D8D2C4' }} />
          <YAxis
            tick={{ fontSize: 12, fill: '#1B242099' }}
            axisLine={{ stroke: '#D8D2C4' }}
            tickFormatter={(v) => formatCompactUgx(v)}
          />
          <Tooltip
            formatter={(value: number) => [formatUgx(value), 'Collected']}
            contentStyle={{ borderRadius: 8, borderColor: '#D8D2C4', fontSize: 13 }}
          />
          <Line type="monotone" dataKey="collected" stroke="#1E7A4C" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
