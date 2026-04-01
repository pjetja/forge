# Plan 12-06 Summary: Drag-and-drop on assigned schema editor

## Inspection (Task 1)

- Exercise row component: `ExerciseEditRow` (inline function in `EditAssignedPlanClient.tsx`)
- Exercise list prop: `exercises: AssignedExercise[]`
- `sort_order` field: present in DB query (edit `page.tsx` fetches with `sort_order` and `.order('sort_order')`) — but not previously in the client prop shape
- No prior reorder action for assigned schema exercises

## DnD implementation (Task 2)

**`src/app/(trainer)/trainer/trainees/[traineeId]/assigned-plans/[assignedPlanId]/edit/EditAssignedPlanClient.tsx`**

- Added imports: `DndContext`, `closestCenter`, `PointerSensor`, `TouchSensor`, `useSensor`, `useSensors`, `DragEndEvent` from `@dnd-kit/core`; `arrayMove`, `SortableContext`, `useSortable`, `verticalListSortingStrategy` from `@dnd-kit/sortable`; `CSS` from `@dnd-kit/utilities`
- Added `items` state with `useEffect` sync (mirrors `SchemaExerciseList.tsx` pattern)
- Added `sensors` with `PointerSensor` (distance: 8) and `TouchSensor` (delay: 250, tolerance: 5) — touch-safe
- Added `handleDragEnd`: optimistic reorder with `arrayMove`, then calls `reorderAssignedSchemaExercises`
- Wrapped exercise list in `DndContext` → `SortableContext` → `div.space-y-2`
- `ExerciseEditRow` made sortable: added `useSortable({ id: exercise.assignedExerciseId })`, `ref={setNodeRef}`, `style` with transform/transition/opacity, drag handle button (⠿ icon with `...attributes` `...listeners`, `touchAction: 'none'`)

**`src/app/(trainer)/trainer/trainees/actions.ts`**

- Added `reorderAssignedSchemaExercises(assignedPlanId, orderedIds)` server action
- Bulk updates `assigned_schema_exercises.sort_order` for each ID via parallel Supabase calls
- Auth check via `getClaims()` before any DB writes

## Dependency check (Task 3)

- `@dnd-kit/core` and `@dnd-kit/sortable` already present in `package.json` — no new installs

## Acceptance criteria

- [x] `DndContext` present in `EditAssignedPlanClient.tsx`
- [x] `reorderAssignedSchemaExercises` server action created in `trainees/actions.ts`
- [x] `@dnd-kit/core` already in `package.json` (no new install)
- [x] TouchSensor with delay constraint — touch-safe
- [x] TypeScript: no errors in modified files
