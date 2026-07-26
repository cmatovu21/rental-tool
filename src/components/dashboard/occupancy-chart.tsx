'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS: Record<string, string> = {
  Occupied: '#1E7A4C',
  Vacant: '#B8842E',
  Maintenance: '#94867A',
};

export function OccupancyChart({
  occupied,
  vacant,
  maintenance,
  occupancyRate,
}: {
  occupied: number;
  vacant: number;
  maintenance: number;
  occupancyRate: number;
}) {
  const data = [
    { name: 'Occupied', value: occupied },
    { name: 'Vacant', value: vacant },
    { name: 'Maintenance', value: maintenance },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-white border border-rule rounded-lg p-5">
      <h3 className="font-display text-base font-semibold text-ink mb-1">Occupancy</h3>
      <p className="text-xs text-ink/50 mb-4">{occupancyRate}% of units occupied</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#D8D2C4', fontSize: 13 }} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-xs text-ink/70">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
