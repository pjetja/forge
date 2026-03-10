'use client';
import { useState, useTransition } from 'react';
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-surface border border-border rounded-sm w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-4">
          <h2 className="text-xl font-bold text-text-primary leading-tight">{exercise.name}</h2>
          <button
            onClick={onClose}
            className="text-text-primary hover:text-accent transition-colors text-xl leading-none cursor-pointer shrink-0"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Muscle group badge */}
        <span className="inline-block bg-bg-page border border-border rounded-sm px-2 py-0.5 text-xs text-text-primary mb-4">
          {exercise.muscleGroup}
        </span>

        {/* Description */}
        {exercise.description && (
          <div className="mb-4">
            <p className="text-sm font-medium text-text-primary mb-1">Description</p>
            <p className="text-sm text-text-primary opacity-80 whitespace-pre-wrap">
              {exercise.description}
            </p>
          </div>
        )}

        {/* Notes */}
        {exercise.notes && (
          <div className="mb-4">
            <p className="text-sm font-medium text-text-primary mb-1">Coaching notes</p>
            <p className="text-sm text-text-primary opacity-80 whitespace-pre-wrap">
              {exercise.notes}
            </p>
          </div>
        )}

        {/* Video */}
        {exercise.videoUrl && (
          <div className="mb-4">
            {videoId ? (
              <div className="relative aspect-video w-full mt-4">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                  title="Exercise video"
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
                Watch video
              </a>
            )}
          </div>
        )}

        {/* Delete error */}
        {deleteError && (
          <p className="text-xs text-error mb-3">{deleteError}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6 flex-wrap">
          <button
            onClick={() => onEdit(exercise)}
            className="bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
          >
            Edit
          </button>

          {!deleteConfirming ? (
            <button
              onClick={() => setDeleteConfirming(true)}
              className="border border-red-800 text-red-400 hover:bg-red-950 rounded-sm px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
            >
              Delete
            </button>
          ) : (
            <>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="bg-red-700 hover:bg-red-800 text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? 'Deleting...' : 'Confirm delete?'}
              </button>
              <button
                onClick={() => setDeleteConfirming(false)}
                disabled={isPending}
                className="border border-border text-text-primary hover:border-accent rounded-sm px-4 py-2 text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
