'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  Open: '#B8842E',
  'In progress': '#1E7A4C',
  'Awaiting approval': '#94867A',
  Completed: '#1B2420',
};

export function MaintenanceChart({
  open,
  inProgress,
  awaitingApproval,
  completed,
}: {
  open: number;
  inProgress: number;
  awaitingApproval: number;
  completed: number;
}) {
  const data = [
    { name: 'Open', value: open },
    { name: 'In progress', value: inProgress },
    { name: 'Awaiting approval', value: awaitingApproval },
    { name: 'Completed', value: completed },
  ];

  return (
    <div className="bg-white border border-rule rounded-lg p-5">
      <h3 className="font-display text-base font-semibold text-ink mb-4">Maintenance tickets</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#1B242099' }} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: '#1B2420' }} />
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#D8D2C4', fontSize: 13 }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
