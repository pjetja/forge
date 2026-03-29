'use client';
import { useState, useTransition } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { useTranslations } from 'next-intl';
import { updateSchemaExercise, removeExerciseFromSchema } from '../plans/actions';
import { ProgressionDropdown } from '@/components/ProgressionDropdown';
import { FilterDropdown } from '@/components/FilterDropdown';

export interface SchemaExerciseItem {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  targetWeightKg: number | null;
  perSetWeights: number[] | null;
  tempo: string | null;
  progressionMode: string;
}


interface SchemaExerciseRowProps {
  item: SchemaExerciseItem;
  schemaId: string;
  planId: string;
  onRemoved: (id: string) => void;
}

function numStr(n: number | null | undefined): string {
  if (n == null || n === 0) return '';
  return String(n);
}

export function SchemaExerciseRow({ item, schemaId, planId, onRemoved }: SchemaExerciseRowProps) {
  const t = useTranslations('trainer');
  const tc = useTranslations('common');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [sets, setSets] = useState(item.sets);
  const [reps, setReps] = useState(item.reps);
  const [targetWeight, setTargetWeight] = useState<string>(numStr(item.targetWeightKg));
  const [perSetMode, setPerSetMode] = useState(item.perSetWeights !== null);
  const [perSetWeights, setPerSetWeights] = useState<string[]>(
    item.perSetWeights
      ? item.perSetWeights.map(numStr)
      : Array(item.sets).fill(numStr(item.targetWeightKg))
  );
  const [tempo, setTempo] = useState(item.tempo ?? '');
  const [progressionMode, setProgressionMode] = useState(item.progressionMode);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isPending, startTransition] = useTransition();

  function saveField(updates: Parameters<typeof updateSchemaExercise>[3]) {
    startTransition(async () => {
      await updateSchemaExercise(item.id, schemaId, planId, updates);
    });
  }

  function handleSetsBlur(newSets: number) {
    const validated = Math.max(1, Math.min(99, newSets));
    setSets(validated);
    if (perSetMode) {
      setPerSetWeights((prev) => {
        const copy = [...prev];
        while (copy.length < validated) copy.push(copy[copy.length - 1] ?? '');
        return copy.slice(0, validated);
      });
    }
    saveField({ sets: validated });
  }

  function handleRepsBlur(newReps: number) {
    const validated = Math.max(1, Math.min(999, newReps));
    setReps(validated);
    saveField({ reps: validated });
  }

  function handleWeightBlur() {
    const val = parseFloat(targetWeight) || null;
    saveField({ targetWeightKg: val });
  }

  function handlePerSetWeightBlur(index: number) {
    const updated = perSetWeights.map((w) => parseFloat(w) || 0);
    saveField({ perSetWeights: updated });
  }

  function togglePerSetMode() {
    const newMode = !perSetMode;
    setPerSetMode(newMode);
    if (newMode) {
      const w = parseFloat(targetWeight) || 0;
      const weights = Array(sets).fill(w);
      setPerSetWeights(weights.map(numStr));
      saveField({ perSetWeights: weights });
    } else {
      const parsed = perSetWeights.map((w) => parseFloat(w) || 0);
      const avg = parsed.reduce((a, b) => a + b, 0) / (parsed.length || 1);
      const single = Math.round(avg * 4) / 4;
      setTargetWeight(numStr(single));
      saveField({ perSetWeights: null, targetWeightKg: single || null });
    }
  }

  function handleRemoveConfirm() {
    setConfirmRemove(false);
    startTransition(async () => {
      const result = await removeExerciseFromSchema(item.id, schemaId, planId);
      if (!('error' in result)) onRemoved(item.id);
    });
  }

  const inputClass =
    'w-16 bg-bg-page border border-border rounded-sm px-2 py-1 text-sm text-text-primary text-center focus:border-accent focus:outline-none';

  return (
    <div ref={setNodeRef} style={style} className="bg-bg-surface border border-border rounded-sm p-3 space-y-2">
      {/* Row header: drag handle + exercise name + remove */}
      <div className="flex items-center gap-2">
        {/* Drag handle — listeners ONLY here, not on the row div */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          style={{ touchAction: 'none' }}
          className="cursor-grab active:cursor-grabbing text-text-primary opacity-40 hover:opacity-100 transition-opacity flex-shrink-0 p-1"
          aria-label={t('schemas.dragToReorder')}
        >
          ⠿
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary text-sm truncate">{item.exerciseName}</p>
          <p className="text-xs text-text-primary opacity-60">{item.muscleGroup}</p>
        </div>

        {confirmRemove ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={handleRemoveConfirm}
              disabled={isPending}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 cursor-pointer disabled:opacity-30"
            >
              {t('schemas.removeConfirm')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemove(false)}
              className="text-xs text-text-primary opacity-50 hover:opacity-100 px-2 py-1 cursor-pointer"
            >
              {tc('button.cancel')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            disabled={isPending}
            title={t('schemas.removeExercise')}
            className="text-text-primary opacity-40 hover:opacity-100 hover:text-red-400 transition-opacity flex-shrink-0 text-lg leading-none cursor-pointer p-1"
            aria-label={t('schemas.removeExercise')}
          >
            &times;
          </button>
        )}
      </div>

      {/* Inputs: sets | reps | weight | tempo | progression */}
      <div className="flex items-end gap-3 pl-7 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-primary opacity-60">{t('schemas.weightMode')}</label>
          <FilterDropdown
            label=""
            options={[
              { value: 'single', label: t('schemas.singleWeight') },
              { value: 'per-set', label: t('schemas.perSetWeights') },
            ]}
            value={perSetMode ? 'per-set' : 'single'}
            onChange={(val) => { if ((val === 'per-set') !== perSetMode) togglePerSetMode(); }}
            buttonClassName="h-7 py-0 text-xs min-w-[126px]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-primary opacity-60">{t('schemas.sets')}</label>
          <input
            type="number"
            className={inputClass}
            value={sets}
            min={1}
            max={99}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setSets(parseInt(e.target.value, 10) || 1)}
            onBlur={(e) => handleSetsBlur(parseInt(e.target.value, 10) || 1)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-primary opacity-60">{t('schemas.reps')}</label>
          <input
            type="number"
            className={inputClass}
            value={reps}
            min={1}
            max={999}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setReps(parseInt(e.target.value, 10) || 1)}
            onBlur={(e) => handleRepsBlur(parseInt(e.target.value, 10) || 1)}
          />
        </div>

        <div className={`flex flex-col gap-1 ${perSetMode ? 'invisible' : ''}`}>
          <label className="text-xs text-text-primary opacity-60">{t('schemas.weightKg')}</label>
          <input
            type="text"
            inputMode="decimal"
            className={inputClass}
            value={targetWeight}
            placeholder="0"
            onFocus={(e) => e.target.select()}
            onChange={(e) => setTargetWeight(e.target.value)}
            onBlur={handleWeightBlur}
            tabIndex={perSetMode ? -1 : 0}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-primary opacity-60">{t('schemas.tempo')}</label>
          <input
            type="text"
            className={inputClass}
            value={tempo}
            placeholder="3010"
            onFocus={(e) => e.target.select()}
            onChange={(e) => setTempo(e.target.value)}
            onBlur={() => saveField({ tempo: tempo || null })}
          />
        </div>

        <ProgressionDropdown
          value={progressionMode}
          onChange={(val) => {
            setProgressionMode(val);
            saveField({ progressionMode: val });
          }}
          buttonClassName="h-7 py-0 text-xs"
        />
      </div>

      {/* Per-set weight inputs */}
      {perSetMode && (
        <div className="pl-7 flex flex-wrap gap-2">
          {perSetWeights.map((w, i) => (
            <div key={i} className="flex flex-col gap-1">
              <label className="text-xs text-text-primary opacity-60">{t('schemas.setLabel', { number: i + 1 })}</label>
              <input
                type="text"
                inputMode="decimal"
                className={inputClass}
                value={w}
                placeholder="0"
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const updated = [...perSetWeights];
                  updated[i] = e.target.value;
                  setPerSetWeights(updated);
                }}
                onBlur={() => handlePerSetWeightBlur(i)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
