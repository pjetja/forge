'use client';
import { useTranslations } from 'next-intl';
import { Exercise } from '@/lib/db/schema';

interface ExerciseCardProps {
  exercise: Exercise;
  onClick: () => void;
}

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const t = useTranslations('trainer');

  return (
    <div
      onClick={onClick}
      className="relative bg-bg-surface border border-border rounded-sm p-4 cursor-pointer hover:border-accent transition-colors"
    >
      {exercise.videoUrl && (
        <span className="absolute top-3 right-3 text-accent" aria-label={t('exercises.hasVideoAriaLabel')}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </span>
      )}
      <p className="font-medium text-text-primary truncate pr-6">{exercise.name}</p>
      <p className="text-sm text-text-primary opacity-60 mt-1">{exercise.muscleGroup}</p>
    </div>
  );
}
