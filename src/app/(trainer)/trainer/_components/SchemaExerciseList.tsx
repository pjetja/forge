'use client';
import { useState, useTransition, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTranslations } from 'next-intl';
import { SchemaExerciseRow, type SchemaExerciseItem } from './SchemaExerciseRow';
import { reorderSchemaExercises } from '../plans/actions';

interface SchemaExerciseListProps {
  initialItems: SchemaExerciseItem[];
  schemaId: string;
  planId: string;
}

export function SchemaExerciseList({ initialItems, schemaId, planId }: SchemaExerciseListProps) {
  const t = useTranslations('trainer');
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();

  // Sync list when server re-renders with new items (e.g. after adding an exercise)
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered); // optimistic update

    startTransition(async () => {
      await reorderSchemaExercises(schemaId, planId, reordered.map((item) => item.id));
    });
  }

  function handleRemoved(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (items.length === 0) {
    return (
      <div className="bg-bg-surface border border-dashed border-border rounded-sm p-8 text-center">
        <p className="text-sm text-text-primary opacity-60">{t('schemas.noExercisesYet')}</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item) => (
            <SchemaExerciseRow
              key={item.id}
              item={item}
              schemaId={schemaId}
              planId={planId}
              onRemoved={handleRemoved}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
