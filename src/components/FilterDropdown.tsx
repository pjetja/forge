'use client';
import { useState, useRef, useEffect } from 'react';

/**
 * CONVENTION: FilterDropdown is the standard dropdown component for this app.
 * Any new dropdown — filters, selectors, option pickers — should be built with
 * this component rather than a native <select>. It provides consistent styling,
 * outside-click dismissal, and keyboard accessibility out of the box.
 *
 * For domain-specific dropdowns that need extra UI (e.g. an info button or modal),
 * wrap FilterDropdown in a dedicated component (see ProgressionDropdown as the reference example).
 */

export interface FilterDropdownOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  buttonClassName?: string;
}

export function FilterDropdown({ label, options, value, onChange, buttonClassName }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = value !== '';
  const selectedLabel = options.find((o) => o.value === value)?.label;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-sm text-sm leading-none border transition-colors cursor-pointer outline-none w-full ${
          active
            ? 'bg-accent text-white border-accent'
            : 'bg-bg-surface text-text-primary border-border hover:border-accent'
        } ${buttonClassName ?? ''}`}
      >
        <span>{active ? (label ? `${label}: ${selectedLabel}` : selectedLabel) : label}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-20 bg-bg-surface border border-border rounded-sm shadow-lg min-w-[120px] py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                value === opt.value
                  ? 'text-accent font-medium'
                  : 'text-text-primary hover:text-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
