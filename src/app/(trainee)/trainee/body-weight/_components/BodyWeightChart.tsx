'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DateRangeToggle } from '@/components/DateRangeToggle';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type DateRange = 'all' | '3m' | '1m';

interface BodyWeightChartProps {
  entries: Array<{ id: string; logged_date: string; weight_kg: string; created_at: string }>;
}

export function BodyWeightChart({ entries }: BodyWeightChartProps) {
  const [showChart, setShowChart] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const t = useTranslations('trainee');

  function getCutoffDate(range: DateRange): Date | null {
    if (range === 'all') return null;
    const now = new Date();
    if (range === '3m') {
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    }
    // '1m'
    return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }

  const cutoff = getCutoffDate(dateRange);
  const filtered = entries
    .filter((e) => {
      if (!cutoff) return true;
      return new Date(e.logged_date) >= cutoff;
    })
    .sort((a, b) => a.logged_date.localeCompare(b.logged_date));

  const chartData = filtered.map((e) => ({
    label: new Date(e.logged_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    weight: parseFloat(e.weight_kg),
    loggedDate: e.logged_date,
  }));

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setShowChart((prev) => !prev)}
        className="text-sm text-accent font-bold hover:text-accent-hover transition-colors underline-offset-4 hover:underline cursor-pointer"
      >
        {showChart ? t('bodyWeight.hideChart') : t('bodyWeight.showChart')}
      </button>

      {showChart && (
        <div className="space-y-3">
          <DateRangeToggle value={dateRange} onChange={setDateRange} />
          {chartData.length < 2 ? (
            <p className="text-sm text-text-primary opacity-60">
              {t('bodyWeight.notEnoughData')}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.45)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.45)' }}
                  unit=" kg"
                  tickLine={false}
                  axisLine={false}
                  width={55}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1f2e',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
