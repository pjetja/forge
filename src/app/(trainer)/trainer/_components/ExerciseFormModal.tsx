'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MUSCLE_GROUPS } from '@/lib/db/schema';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('trainer');
  const tc = useTranslations('common');
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

  const title = mode === 'create' ? t('exercises.addExercise') : t('exercises.editExercise');

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Panel — full screen on mobile, right-side panel on desktop */}
      <div className="fixed inset-0 md:inset-y-0 md:left-auto md:right-0 md:w-[680px] bg-bg-surface md:border-l border-border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-primary hover:text-accent transition-colors text-xl leading-none cursor-pointer"
            aria-label={tc('aria.close')}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 min-h-0">
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                {t('exercises.nameLabel')} <span className="text-error">*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder={t('exercises.namePlaceholder')}
                className="w-full bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
              />
              {errors.name && (
                <p className="text-xs text-error mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Muscle group */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                {t('exercises.muscleGroupLabel')} <span className="text-error">*</span>
              </label>
              <select
                {...register('muscleGroup')}
                className="w-full bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="">{t('exercises.muscleGroupPlaceholder')}</option>
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
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                {t('exercises.descriptionLabel')}
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder={t('exercises.descriptionPlaceholder')}
                className="w-full bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none resize-none"
              />
              {errors.description && (
                <p className="text-xs text-error mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                {t('exercises.coachingNotesLabel')}
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder={t('exercises.coachingNotesPlaceholder')}
                className="w-full bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none resize-none"
              />
              {errors.notes && (
                <p className="text-xs text-error mt-1">{errors.notes.message}</p>
              )}
            </div>

            {/* Video URL */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                {t('exercises.videoUrlLabel')}
              </label>
              <input
                {...register('videoUrl')}
                type="url"
                placeholder={t('exercises.videoUrlPlaceholder')}
                className="w-full bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
              />
              {errors.videoUrl && (
                <p className="text-xs text-error mt-1">{errors.videoUrl.message}</p>
              )}
            </div>

            {/* Root / server error */}
            {errors.root && (
              <p className="text-xs text-error">{errors.root.message}</p>
            )}
          </div>

          {/* Footer — sticky actions */}
          <div className="shrink-0 px-6 py-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-border text-text-primary hover:border-accent rounded-sm px-4 py-2 text-sm cursor-pointer"
            >
              {tc('button.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? t('exercises.addingExercise') : mode === 'create' ? t('exercises.addExercise') : t('exercises.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
