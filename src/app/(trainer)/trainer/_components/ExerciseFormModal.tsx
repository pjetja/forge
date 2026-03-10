'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MUSCLE_GROUPS } from '@/lib/db/schema';
import { createExercise, updateExercise, ExerciseFormData } from '../exercises/actions';

function extractYouTubeId(url: string): string | null {
  const regex =
    /(?:youtube(?:-nocookie)?\.com\/(?:[^\\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match?.[1] ?? null;
}

const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').max(100, 'Name too long'),
  muscleGroup: z.enum(MUSCLE_GROUPS, { error: 'Select a muscle group' }),
  description: z.string().max(500, 'Max 500 characters').optional(),
  notes: z.string().max(500, 'Max 500 characters').optional(),
  videoUrl: z
    .string()
    .optional()
    .refine(
      (val) => !val || extractYouTubeId(val) !== null,
      'Must be a valid YouTube URL (or leave blank)'
    ),
});

type ExerciseSchemaValues = z.infer<typeof exerciseSchema>;

interface ExerciseFormModalProps {
  mode: 'create' | 'edit';
  initialValues?: ExerciseFormData;
  exerciseId?: string;
  onClose: () => void;
}

export function ExerciseFormModal({
  mode,
  initialValues,
  exerciseId,
  onClose,
}: ExerciseFormModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ExerciseSchemaValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      muscleGroup: (initialValues?.muscleGroup as typeof MUSCLE_GROUPS[number]) ?? undefined,
      description: initialValues?.description ?? '',
      notes: initialValues?.notes ?? '',
      videoUrl: initialValues?.videoUrl ?? '',
    },
  });

  function onSubmit(values: ExerciseSchemaValues) {
    startTransition(async () => {
      const formData: ExerciseFormData = {
        name: values.name,
        muscleGroup: values.muscleGroup,
        description: values.description || undefined,
        notes: values.notes || undefined,
        videoUrl: values.videoUrl || undefined,
      };

      let result: { success: true } | { error: string };

      if (mode === 'edit' && exerciseId) {
        result = await updateExercise(exerciseId, formData);
      } else {
        result = await createExercise(formData);
      }

      if ('error' in result) {
        setError('root', { message: result.error });
      } else {
        router.refresh();
        onClose();
      }
    });
  }

  const title = mode === 'create' ? 'Add exercise' : 'Edit exercise';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-surface border border-border rounded-sm w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-primary hover:text-accent transition-colors text-xl leading-none cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Name */}
          <div className="mb-4">
            <label className="text-sm font-medium text-text-primary mb-1 block">
              Exercise name <span className="text-error">*</span>
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g. Barbell Back Squat"
              className="w-full bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
            {errors.name && (
              <p className="text-xs text-error mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Muscle group */}
          <div className="mb-4">
            <label className="text-sm font-medium text-text-primary mb-1 block">
              Muscle group <span className="text-error">*</span>
            </label>
            <select
              {...register('muscleGroup')}
              className="w-full bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="">Select a muscle group</option>
              {MUSCLE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
            {errors.muscleGroup && (
              <p className="text-xs text-error mt-1">{errors.muscleGroup.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="text-sm font-medium text-text-primary mb-1 block">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Optional: describe the exercise technique..."
              className="w-full bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none resize-none"
            />
            {errors.description && (
              <p className="text-xs text-error mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="text-sm font-medium text-text-primary mb-1 block">
              Coaching notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Optional: coaching cues, common mistakes..."
              className="w-full bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none resize-none"
            />
            {errors.notes && (
              <p className="text-xs text-error mt-1">{errors.notes.message}</p>
            )}
          </div>

          {/* Video URL */}
          <div className="mb-5">
            <label className="text-sm font-medium text-text-primary mb-1 block">
              Video URL (YouTube)
            </label>
            <input
              {...register('videoUrl')}
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
            {errors.videoUrl && (
              <p className="text-xs text-error mt-1">{errors.videoUrl.message}</p>
            )}
          </div>

          {/* Root / server error */}
          {errors.root && (
            <p className="text-xs text-error mb-4">{errors.root.message}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-border text-text-primary hover:border-accent rounded-sm px-4 py-2 text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Saving...' : mode === 'create' ? 'Add exercise' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
