'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Schema {
  id: string;
  name: string;
  slotIndex: number;
  sortOrder: number;
}

interface PlanWeekViewProps {
  planId: string;
  workoutsPerWeek: number;
  schemas: Schema[];
}

const IconPencil = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

export function PlanWeekView({ planId, workoutsPerWeek, schemas }: PlanWeekViewProps) {
  const t = useTranslations('trainer');
  const schemaBySlot: Record<number, Schema | undefined> = {};
  for (const schema of schemas) {
    schemaBySlot[schema.slotIndex] = schema;
  }

  const slots = Array.from({ length: workoutsPerWeek }, (_, i) => i + 1);

  return (
    <div className="space-y-2">
      {slots.map((slot) => {
        const schema = schemaBySlot[slot];
        return schema ? (
          <Link
            key={slot}
            href={`/trainer/plans/${planId}/schemas/${schema.id}`}
            className="bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between hover:border-accent transition-colors cursor-pointer"
          >
            <div>
              <p className="text-xs text-text-primary opacity-60 mb-0.5">{t('schemas.workoutLabel', { slot })}</p>
              <p className="font-medium text-text-primary">{schema.name}</p>
            </div>
            <span className="p-2 text-text-primary opacity-40 flex-shrink-0 ml-3">
              <IconPencil />
            </span>
          </Link>
        ) : (
          <div
            key={slot}
            className="bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-text-primary opacity-60 mb-0.5">{t('schemas.workoutLabel', { slot })}</p>
              <p className="font-medium text-text-primary opacity-50">{t('schemas.unassigned')}</p>
            </div>
            <span className="text-xs text-text-primary opacity-40 flex-shrink-0 ml-3">{t('schemas.noSchemaYet')}</span>
          </div>
        );
      })}
    </div>
  );
}
