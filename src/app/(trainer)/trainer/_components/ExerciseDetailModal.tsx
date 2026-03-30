'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Exercise } from '@/lib/db/schema';
import { deleteExercise } from '../exercises/actions';

function extractYouTubeId(url: string): string | null {
  const regex =
    /(?:youtube(?:-nocookie)?\.com\/(?:[^\\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match?.[1] ?? null;
}

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
  onEdit: (exercise: Exercise) => void;
}

export function ExerciseDetailModal({ exercise, onClose, onEdit }: ExerciseDetailModalProps) {
  const t = useTranslations('trainer');
  const tc = useTranslations('common');
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteExercise(exercise.id);
      if ('error' in result) {
        setDeleteError(result.error);
      } else {
        onClose();
      }
    });
  }

  const videoId = exercise.videoUrl ? extractYouTubeId(exercise.videoUrl) : null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Panel — full screen on mobile, right-side panel on desktop */}
      <div className="fixed inset-0 md:inset-y-0 md:left-auto md:right-0 md:w-[680px] bg-bg-surface md:border-l border-border overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 gap-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-text-primary leading-tight mb-2">
              {exercise.name}
            </h2>
            <span className="inline-block bg-bg-page border border-border rounded-sm px-2 py-0.5 text-xs text-text-primary">
              {exercise.muscleGroup}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-primary hover:text-accent transition-colors text-xl leading-none cursor-pointer shrink-0 mt-0.5"
            aria-label={tc('aria.close')}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-6 space-y-5">
          {/* Description */}
          {exercise.description && (
            <div>
              <p className="text-sm font-bold text-text-primary mb-1">{t('exercises.descriptionSection')}</p>
              <p className="text-sm text-text-primary opacity-80 whitespace-pre-wrap">
                {exercise.description}
              </p>
            </div>
          )}

          {/* Notes */}
          {exercise.notes && (
            <div>
              <p className="text-sm font-bold text-text-primary mb-1">{t('exercises.coachingNotesSection')}</p>
              <p className="text-sm text-text-primary opacity-80 whitespace-pre-wrap">
                {exercise.notes}
              </p>
            </div>
          )}

          {/* Video */}
          {exercise.videoUrl && (
            <div>
              <p className="text-sm font-bold text-text-primary mb-2">{t('exercises.videoLabel')}</p>
              {videoId ? (
                <div className="relative aspect-video w-full">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                    title={t('exercises.videoLabel')}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full rounded-sm"
                  />
                </div>
              ) : (
                <a
                  href={exercise.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  {t('exercises.watchVideo')}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer — actions */}
        <div className="px-6 py-4 border-t border-border">
          {deleteError && (
            <p className="text-xs text-error mb-3">{deleteError}</p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => onEdit(exercise)}
              className="bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
            >
              {tc('button.edit')}
            </button>

            {!deleteConfirming ? (
              <button
                onClick={() => setDeleteConfirming(true)}
                className="border border-red-800 text-red-400 hover:bg-red-950 rounded-sm px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
              >
                {tc('button.delete')}
              </button>
            ) : (
              <>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="bg-red-700 hover:bg-red-800 text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending ? t('exercises.deleting') : t('exercises.deleteConfirm')}
                </button>
                <button
                  onClick={() => setDeleteConfirming(false)}
                  disabled={isPending}
                  className="border border-border text-text-primary hover:border-accent rounded-sm px-4 py-2 text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {tc('button.cancel')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
