"use client";
import { useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  editAssignedPlan,
  reorderAssignedSchemaExercises,
  type AssignedExerciseUpdate,
} from "../../../../actions";

interface AssignedExercise {
  assignedExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  targetWeightKg: number | null;
  perSetWeights: number[] | null;
}

interface EditAssignedPlanClientProps {
  assignedPlanId: string;
  traineeId: string;
  exercises: AssignedExercise[];
}

export function EditAssignedPlanClient({
  assignedPlanId,
  traineeId,
  exercises,
}: EditAssignedPlanClientProps) {
  const [, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [items, setItems] = useState(exercises);
  const t = useTranslations("trainer");

  useEffect(() => {
    setItems(exercises);
  }, [exercises]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  function saveUpdates(updates: AssignedExerciseUpdate[]) {
    startTransition(async () => {
      await editAssignedPlan(assignedPlanId, traineeId, updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(
      (item) => item.assignedExerciseId === active.id,
    );
    const newIndex = items.findIndex(
      (item) => item.assignedExerciseId === over.id,
    );
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    startTransition(async () => {
      await reorderAssignedSchemaExercises(
        assignedPlanId,
        reordered.map((item) => item.assignedExerciseId),
      );
    });
  }

  const inputClass =
    "w-16 bg-bg-page border border-border rounded-sm px-2 py-1 text-sm text-text-primary text-center focus:border-accent focus:outline-none";

  return (
    <div className="space-y-3">
      {saved && (
        <div className="text-sm text-accent bg-accent/10 border border-accent/30 rounded-sm px-3 py-2">
          {t("traineeDetail.editPlan.changesSaved")}
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.assignedExerciseId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((ex) => (
              <ExerciseEditRow
                key={ex.assignedExerciseId}
                exercise={ex}
                onSave={(updates) => saveUpdates([updates])}
                inputClass={inputClass}
                setsLabel={t("traineeDetail.editPlan.sets")}
                repsLabel={t("traineeDetail.editPlan.reps")}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {items.length === 0 && (
        <p className="text-sm text-text-primary opacity-60">
          {t("traineeDetail.editPlan.noExercises")}
        </p>
      )}
    </div>
  );
}

function ExerciseEditRow({
  exercise,
  onSave,
  inputClass,
  setsLabel,
  repsLabel,
}: {
  exercise: AssignedExercise;
  onSave: (update: AssignedExerciseUpdate) => void;
  inputClass: string;
  setsLabel: string;
  repsLabel: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: exercise.assignedExerciseId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [sets, setSets] = useState(exercise.sets);
  const [reps, setReps] = useState(exercise.reps);
  const [weight, setWeight] = useState(exercise.targetWeightKg ?? 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-bg-surface border border-border rounded-sm p-4 flex items-center gap-4"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        style={{ touchAction: "none" }}
        className="cursor-grab active:cursor-grabbing text-text-primary opacity-40 hover:opacity-100 transition-opacity flex-shrink-0 p-1"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-text-primary truncate">
          {exercise.exerciseName}
        </p>
        <p className="text-xs text-text-primary opacity-60">
          {exercise.muscleGroup}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs text-text-primary opacity-50">
            {setsLabel}
          </span>
          <input
            type="number"
            className={inputClass}
            value={sets}
            min={1}
            max={99}
            onChange={(e) => setSets(parseInt(e.target.value, 10) || 1)}
            onBlur={(e) =>
              onSave({
                assignedExerciseId: exercise.assignedExerciseId,
                sets: parseInt(e.target.value, 10) || 1,
              })
            }
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs text-text-primary opacity-50">
            {repsLabel}
          </span>
          <input
            type="number"
            className={inputClass}
            value={reps}
            min={1}
            max={999}
            onChange={(e) => setReps(parseInt(e.target.value, 10) || 1)}
            onBlur={(e) =>
              onSave({
                assignedExerciseId: exercise.assignedExerciseId,
                reps: parseInt(e.target.value, 10) || 1,
              })
            }
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs text-text-primary opacity-50">kg</span>
          <input
            type="number"
            className={inputClass}
            value={weight}
            min={0}
            step={0.5}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            onBlur={(e) =>
              onSave({
                assignedExerciseId: exercise.assignedExerciseId,
                targetWeightKg: parseFloat(e.target.value) || null,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
