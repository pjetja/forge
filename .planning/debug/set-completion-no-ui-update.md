---
status: fixing
trigger: "When marking a set as done on the exercise detail page, the request fires but the UI doesn't update. The SetList component uses useOptimistic."
created: 2026-03-13T00:00:00Z
updated: 2026-03-13T00:00:00Z
---

## Current Focus

hypothesis: useOptimistic is not showing the update because startTransition is used — but the real issue is that useOptimistic reverts to server state immediately when the transition completes, because completeSet does NOT call revalidatePath. After the server action returns, Next.js does NOT re-render the server component, so `sets` prop stays the same stale value. useOptimistic merges the optimistic update with the base `sets` prop — once the transition ends, the optimistic layer is discarded and the original `sets` (with completed: false) is shown again.
test: Verified by reading the code: completeSet has a comment "Does NOT revalidatePath — optimistic UI handles display; full revalidate on page navigation." But useOptimistic requires the underlying state to be updated (via revalidatePath or router.refresh) BEFORE or AT the same time the transition completes, otherwise it falls back to the original prop value.
expecting: Adding revalidatePath in completeSet will cause the server component to re-render with the new completed=true value, making useOptimistic's optimistic update permanent.
next_action: Apply fix — add revalidatePath to completeSet

## Symptoms

expected: Clicking "done" on a set row should optimistically mark it as completed in the UI immediately, and persist to server
actual: The request fires (network call happens) but the UI shows no change — set row doesn't update to "done" state
errors: none reported
reproduction: Go to a workout session → open an exercise → click done on a set row
started: unknown — may have always been broken

## Eliminated

- hypothesis: useOptimistic reducer is wrong (maps on wrong field)
  evidence: The reducer maps on `s.setNumber === update.setNumber` and sets `completed: true`. The setNumber field is correctly passed. The reducer logic is correct.
  timestamp: 2026-03-13T00:00:00Z

- hypothesis: handleComplete passes wrong setNumber to addOptimistic
  evidence: handleComplete(setNumber) passes the correct setNumber both to addOptimistic and completeSet. No mismatch.
  timestamp: 2026-03-13T00:00:00Z

- hypothesis: The set row rendering ignores `set.completed`
  evidence: The row uses `set.completed` for opacity class and button styling. It correctly reads the field.
  timestamp: 2026-03-13T00:00:00Z

## Evidence

- timestamp: 2026-03-13T00:00:00Z
  checked: completeSet server action in actions.ts (line 64-94)
  found: Explicit comment says "Does NOT revalidatePath — optimistic UI handles display; full revalidate on page navigation." No revalidatePath call after successful upsert.
  implication: After the transition completes, Next.js does not re-render the server component. The `sets` prop passed to SetList is stale (completed: false). useOptimistic reverts to the base state (`sets`) once the transition ends.

- timestamp: 2026-03-13T00:00:00Z
  checked: useOptimistic behavior in React docs
  found: useOptimistic(state, updateFn) — when the async action completes, the optimistic state is discarded and falls back to `state`. If `state` hasn't been updated by a server re-render, the UI reverts.
  implication: The optimistic update is visible during the transition, then disappears when completeSet resolves. This matches the reported symptom exactly: "the UI shows no change" (user may not notice the brief flash during the async call, or the transition is fast enough that the flash isn't visible at all).

- timestamp: 2026-03-13T00:00:00Z
  checked: addSet handler (line 104-118)
  found: addSet DOES call router.refresh() after the server action, which triggers a server re-render and syncs the state. completeSet has no equivalent refresh mechanism.
  implication: The pattern for addSet is correct and proves the mechanism works. completeSet just needs the same refresh trigger.

## Resolution

root_cause: completeSet server action intentionally omits revalidatePath. After the transition completes, useOptimistic reverts to the stale `sets` prop (where completed: false). The server component never re-renders with the updated DB state, so the optimistic update is immediately discarded. The fix is to add revalidatePath in completeSet OR call router.refresh() in the client after completeSet resolves.
fix: Add revalidatePath for the exercise detail page in completeSet server action. Alternatively (and more precisely), call router.refresh() in the client handleComplete after a successful result — this is the same pattern used by handleAddSet and avoids cache-busting unrelated paths.
verification: pending
files_changed: []
