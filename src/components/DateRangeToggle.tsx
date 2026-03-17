'use client';

type DateRange = 'all' | '3m' | '1m';

interface DateRangeToggleProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export function DateRangeToggle({ value, onChange }: DateRangeToggleProps) {
  const options: { key: DateRange; label: string }[] = [
    { key: 'all', label: 'All time' },
    { key: '3m', label: 'Last 3 months' },
    { key: '1m', label: 'Last month' },
  ];

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={
            option.key === value
              ? 'bg-accent text-white text-xs px-3 py-1 rounded-full border border-accent cursor-pointer'
              : 'bg-bg-surface text-text-primary text-xs px-3 py-1 rounded-full border border-border hover:border-accent cursor-pointer'
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
