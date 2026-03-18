'use client';

import { useState } from 'react';
import { DateRangeToggle } from '@/components/DateRangeToggle';
import { ProgressChart } from '@/app/(trainee)/trainee/plans/[assignedPlanId]/exercises/[exerciseId]/_components/ProgressChart';

type DateRange = 'all' | '3m' | '1m';

interface ChartPoint extends Record<string, string | number | null> {
  label: string;
  set1: number | null;
  completedAt: string;
}

interface TraineeCrossPlanChartProps {
  allChartData: ChartPoint[];
}

export function TraineeCrossPlanChart({ allChartData }: TraineeCrossPlanChartProps) {
  const [dateRange, setDateRange] = useState<DateRange>('all');

  const now = new Date();
  const cutoff =
    dateRange === '3m'
      ? new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      : dateRange === '1m'
        ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        : null;

  const filteredData = cutoff
    ? allChartData.filter((d) => d.completedAt && new Date(d.completedAt) >= cutoff)
    : allChartData;

  const firstVal = filteredData.length > 0 ? filteredData[0].set1 : null;
  const lastVal = filteredData.length > 0 ? filteredData[filteredData.length - 1].set1 : null;
  const changeDelta =
    firstVal != null && lastVal != null && filteredData.length > 1
      ? Math.round((lastVal - firstVal) * 10) / 10
      : null;

  const hasAnyData = allChartData.length > 0;
  const hasFilteredData = filteredData.length > 0;

  const personalRecord = hasAnyData
    ? allChartData.reduce<number | null>((max, d) => {
        if (d.set1 == null) return max;
        return max == null || d.set1 > max ? d.set1 : max;
      }, null)
    : null;

  return (
    <div className="space-y-4">
      {personalRecord != null && (
        <div className="bg-bg-surface border border-accent rounded-sm px-4 py-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-text-primary uppercase tracking-wide opacity-60">Personal Record</p>
          <p className="text-lg font-bold text-accent">{personalRecord} kg</p>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-text-primary opacity-60 uppercase tracking-wide">
          Top-set weight over time
        </h2>
        <DateRangeToggle value={dateRange} onChange={setDateRange} />
      </div>

      {!hasAnyData ? (
        <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
          <p className="text-sm text-text-primary opacity-50">No logged sets for this exercise yet.</p>
        </div>
      ) : !hasFilteredData ? (
        <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
          <p className="text-sm text-text-primary opacity-50">No data for this period.</p>
        </div>
      ) : (
        <>
          {changeDelta !== null && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-bg-surface border border-border rounded-sm px-3 py-3 text-center">
                <p className="text-xs text-text-primary opacity-50 mb-1">Start</p>
                <p className="text-lg font-bold text-text-primary">
                  {firstVal != null ? `${firstVal} kg` : '—'}
                </p>
              </div>
              <div className="bg-bg-surface border border-border rounded-sm px-3 py-3 text-center">
                <p className="text-xs text-text-primary opacity-50 mb-1">Finish</p>
                <p className="text-lg font-bold text-text-primary">
                  {lastVal != null ? `${lastVal} kg` : '—'}
                </p>
              </div>
              <div className="bg-bg-surface border border-border rounded-sm px-3 py-3 text-center">
                <p className="text-xs text-text-primary opacity-50 mb-1">Change</p>
                <p
                  className={`text-lg font-bold ${
                    changeDelta > 0
                      ? 'text-accent'
                      : changeDelta < 0
                        ? 'text-red-400'
                        : 'text-text-primary'
                  }`}
                >
                  {changeDelta > 0 ? '+' : ''}
                  {changeDelta} kg
                </p>
              </div>
            </div>
          )}

          <div className="bg-bg-surface border border-border rounded-sm px-2 py-4">
            <ProgressChart data={filteredData} setCount={1} unit="kg" />
          </div>
        </>
      )}
    </div>
  );
}
