'use client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const SET_COLORS = [
  '#4ade80', // green  (Set 1)
  '#60a5fa', // blue   (Set 2)
  '#f472b6', // pink   (Set 3)
  '#fb923c', // orange (Set 4)
  '#a78bfa', // purple (Set 5)
  '#34d399', // teal   (Set 6+)
];

interface ProgressChartProps {
  data: Array<Record<string, number | null | string>>;
  setCount: number;
  unit?: string;
}

export function ProgressChart({ data, setCount, unit = 'kg' }: ProgressChartProps) {
  if (setCount === 0 || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-text-primary opacity-50">
        No data to chart
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barCategoryGap="20%" barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.45)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.45)' }}
          tickLine={false}
          axisLine={false}
          unit={` ${unit}`}
        />
        <Tooltip
          contentStyle={{
            background: '#1a1f2e',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '4px',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
          formatter={(value, name) => [`${value} ${unit}`, name]}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
        />
        <Legend
          wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)' }}>{value}</span>}
        />
        {Array.from({ length: setCount }, (_, i) => {
          const setNum = i + 1;
          const color = SET_COLORS[i % SET_COLORS.length];
          return (
            <Bar
              key={`set${setNum}`}
              dataKey={`set${setNum}`}
              name={`Set ${setNum}`}
              fill={color}
              radius={[3, 3, 0, 0]}
            />
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );
}
