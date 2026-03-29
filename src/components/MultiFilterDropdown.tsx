'use client';
import { useState, useRef, useEffect } from 'react';
import { FilterDropdownOption } from './FilterDropdown';

interface MultiFilterDropdownProps {
  label: string;
  options: FilterDropdownOption[];
  values: string[];
  onChange: (values: string[]) => void;
}

export function MultiFilterDropdown({ label, options, values, onChange }: MultiFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = values.length > 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggle(value: string) {
    onChange(
      values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
    );
  }

  const triggerLabel = active ? `${label} (${values.length})` : label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm leading-none border transition-colors cursor-pointer outline-none ${
          active
            ? 'bg-accent text-white border-accent'
            : 'bg-bg-surface text-text-primary border-border hover:border-accent'
        }`}
      >
        {triggerLabel}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-20 bg-bg-surface border border-border rounded-sm shadow-lg min-w-[160px] py-1 max-h-64 overflow-y-auto">
          {options.map((opt) => {
            const selected = values.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className="w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer flex items-center gap-2.5 hover:text-accent group"
              >
                {/* Checkbox */}
                <span className={`w-3.5 h-3.5 shrink-0 rounded-[2px] border flex items-center justify-center transition-colors ${
                  selected ? 'bg-accent border-accent' : 'border-border group-hover:border-accent'
                }`}>
                  {selected && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className={selected ? 'text-accent font-medium' : 'text-text-primary'}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
