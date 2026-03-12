'use client';
import { useState } from 'react';
import Link from 'next/link';

interface Schema {
  id: string;
  name: string;
  slotIndex: number; // 1-indexed: which workout slot this schema occupies
  sortOrder: number;
}

interface PlanWeekViewProps {
  planId: string;
  weekCount: number;
  workoutsPerWeek: number;
  schemas: Schema[]; // All schemas for this plan (single template — same across all weeks)
}

export function PlanWeekView({ planId, weekCount, workoutsPerWeek, schemas }: PlanWeekViewProps) {
  const [activeWeek, setActiveWeek] = useState(1);

  // Map slot index to schema (slotIndex 1..workoutsPerWeek)
  const schemaBySlot: Record<number, Schema | undefined> = {};
  for (const schema of schemas) {
    schemaBySlot[schema.slotIndex] = schema;
  }

  const weeks = Array.from({ length: weekCount }, (_, i) => i + 1);
  const slots = Array.from({ length: workoutsPerWeek }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      {/* Week tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {weeks.map((week) => (
          <button
            key={week}
            type="button"
            onClick={() => setActiveWeek(week)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              activeWeek === week
                ? 'bg-accent text-white'
                : 'bg-bg-surface border border-border text-text-primary hover:border-accent'
            }`}
          >
            Week {week}
          </button>
        ))}
      </div>

      {/* Workout slots — same schemas regardless of which week tab is active */}
      <div className="space-y-2">
        {slots.map((slot) => {
          const schema = schemaBySlot[slot];
          return (
            <div
              key={slot}
              className="bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-text-primary mb-0.5">Workout {slot}</p>
                <p className={`font-medium ${schema ? 'text-text-primary' : 'text-text-primary opacity-50'}`}>
                  {schema ? schema.name : 'Unassigned'}
                </p>
              </div>
              {schema ? (
                <Link
                  href={`/trainer/plans/${planId}/schemas/${schema.id}`}
                  className="text-sm text-accent hover:underline flex-shrink-0 ml-3"
                >
                  Edit exercises
                </Link>
              ) : (
                <span className="text-xs text-text-primary opacity-50 flex-shrink-0 ml-3">
                  No schema yet
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Info note about template model */}
      <p className="text-xs text-text-primary opacity-60">
        All weeks follow this same schedule. The week tabs let you preview how the plan reads week by week.
      </p>
    </div>
  );
}
