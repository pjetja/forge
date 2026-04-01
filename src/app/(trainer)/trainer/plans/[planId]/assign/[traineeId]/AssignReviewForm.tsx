"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignPlan,
  type ExerciseOverride,
} from "@/app/(trainer)/trainer/trainees/actions";
import { ProgressionDropdown } from "@/components/ProgressionDropdown";
import type { SchemaWithExercises } from "./page";

interface AssignReviewFormProps {
  planId: string;
  traineeAuthUid: string;
  traineeName: string;
  hasExistingActivePlan: boolean;
  schemas: SchemaWithExercises[];
  historyByExerciseId: Record<string, number>;
}

export function AssignReviewForm({
  planId,
  traineeAuthUid,
  traineeName,
  hasExistingActivePlan,
  schemas,
  historyByExerciseId,
}: AssignReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(!hasExistingActivePlan);

  const allExercises = schemas.flatMap((s) => s.exercises);

  const [setsOverrides, setSetsOverrides] = useState<Record<string, number>>(
    () => {
      const init: Record<string, number> = {};
      for (const ex of allExercises) init[ex.exerciseId] = ex.sets;
      return init;
    },
  );

  const [repsOverrides, setRepsOverrides] = useState<Record<string, number>>(
    () => {
      const init: Record<string, number> = {};
      for (const ex of allExercises) init[ex.exerciseId] = ex.reps;
      return init;
    },
  );

  const [weightOverrides, setWeightOverrides] = useState<
    Record<string, number | null>
  >(() => {
    const init: Record<string, number | null> = {};
    for (const ex of allExercises) {
      init[ex.exerciseId] =
        historyByExerciseId[ex.exerciseId] ?? ex.templateWeightKg;
    }
    return init;
  });

  const [tempoOverrides, setTempoOverrides] = useState<Record<string, string>>(
    () => {
      const init: Record<string, string> = {};
      for (const ex of allExercises) {
        init[ex.exerciseId] = ex.templateTempo ?? "";
      }
      return init;
    },
  );

  const [progressionOverrides, setProgressionOverrides] = useState<
    Record<string, string>
  >(() => {
    const init: Record<string, string> = {};
    for (const ex of allExercises) {
      init[ex.exerciseId] = ex.templateProgressionMode;
    }
    return init;
  });

  const [rpeTargetOverrides, setRpeTargetOverrides] = useState<
    Record<string, string>
  >(() => {
    const init: Record<string, string> = {};
    for (const ex of allExercises) {
      init[ex.exerciseId] =
        ex.templateRpeTarget != null ? String(ex.templateRpeTarget) : "";
    }
    return init;
  });

  const [rirTargetOverrides, setRirTargetOverrides] = useState<
    Record<string, string>
  >(() => {
    const init: Record<string, string> = {};
    for (const ex of allExercises) {
      init[ex.exerciseId] =
        ex.templateRirTarget != null ? String(ex.templateRirTarget) : "";
    }
    return init;
  });

  const [weightIncrementOverrides, setWeightIncrementOverrides] = useState<
    Record<string, string>
  >(() => {
    const init: Record<string, string> = {};
    for (const ex of allExercises) {
      init[ex.exerciseId] =
        ex.templateWeightIncrementPerWeek != null
          ? String(ex.templateWeightIncrementPerWeek)
          : "";
    }
    return init;
  });

  function handleAssign() {
    if (!confirmed) {
      setError("Confirm the warning above to proceed.");
      return;
    }
    startTransition(async () => {
      const overrides: ExerciseOverride[] = allExercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        sets: setsOverrides[ex.exerciseId] ?? ex.sets,
        reps: repsOverrides[ex.exerciseId] ?? ex.reps,
        targetWeightKg: weightOverrides[ex.exerciseId] ?? null,
        perSetWeights: null,
        tempo: tempoOverrides[ex.exerciseId]?.trim() || null,
        progressionMode: progressionOverrides[ex.exerciseId] ?? "none",
        rpeTarget: rpeTargetOverrides[ex.exerciseId]
          ? parseInt(rpeTargetOverrides[ex.exerciseId], 10)
          : null,
        rirTarget: rirTargetOverrides[ex.exerciseId]
          ? parseInt(rirTargetOverrides[ex.exerciseId], 10)
          : null,
        weightIncrementPerWeek: weightIncrementOverrides[ex.exerciseId]
          ? parseFloat(weightIncrementOverrides[ex.exerciseId])
          : null,
      }));
      const result = await assignPlan(planId, traineeAuthUid, overrides);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.push(`/trainer/trainees/${traineeAuthUid}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Existing plan warning */}
      {hasExistingActivePlan && (
        <div className="border border-yellow-800/40 bg-yellow-950/30 rounded-sm p-4 space-y-3">
          <div>
            <p className="text-sm text-yellow-300 font-medium">
              {traineeName} already has an active or pending plan.
            </p>
            <p className="text-xs text-yellow-400 mt-1">
              The new plan will be queued as pending and start when their
              current plan ends.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="accent-accent"
            />
            <span className="text-sm text-text-primary">
              I understand — assign anyway
            </span>
          </label>
        </div>
      )}

      {/* Exercises grouped by workout schema */}
      {schemas.map((schema) => (
        <section key={schema.schemaId} className="space-y-2">
          <h2 className="text-sm font-semibold text-text-primary opacity-60 uppercase tracking-wide border-b border-border pb-1.5">
            {schema.schemaName}
          </h2>
          <div className="space-y-2">
            {schema.exercises.map((ex) => {
              const fromHistory = historyByExerciseId[ex.exerciseId] != null;
              return (
                <div
                  key={ex.schemaExerciseId}
                  className="bg-bg-surface border border-border rounded-sm px-4 py-3 space-y-3"
                >
                  {/* Row 1: name */}
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-text-primary truncate">
                      {ex.exerciseName}
                    </p>
                    <p className="text-xs text-text-primary opacity-60 mt-0.5">
                      {ex.sets} sets &times; {ex.reps} reps
                      {ex.muscleGroup && <> &middot; {ex.muscleGroup}</>}
                    </p>
                  </div>

                  {/* Row 2: sets + reps + weight + tempo + progression + info */}
                  <div className="flex items-end gap-3">
                    {/* Sets */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-text-primary opacity-50">
                        Sets
                      </label>
                      <input
                        type="number"
                        value={setsOverrides[ex.exerciseId] ?? ex.sets}
                        min={1}
                        max={20}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!isNaN(v) && v > 0)
                            setSetsOverrides((prev) => ({
                              ...prev,
                              [ex.exerciseId]: v,
                            }));
                        }}
                        className="w-14 h-7 bg-bg-page border border-border rounded-sm px-2 text-sm text-text-primary text-center focus:border-accent focus:outline-none"
                      />
                    </div>

                    {/* Reps */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-text-primary opacity-50">
                        Reps
                      </label>
                      <input
                        type="number"
                        value={repsOverrides[ex.exerciseId] ?? ex.reps}
                        min={1}
                        max={100}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!isNaN(v) && v > 0)
                            setRepsOverrides((prev) => ({
                              ...prev,
                              [ex.exerciseId]: v,
                            }));
                        }}
                        className="w-14 h-7 bg-bg-page border border-border rounded-sm px-2 text-sm text-text-primary text-center focus:border-accent focus:outline-none"
                      />
                    </div>

                    {/* Weight */}
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-text-primary opacity-50 flex items-center gap-1">
                        Weight (kg)
                        {fromHistory && (
                          <span className="text-accent opacity-70">· last</span>
                        )}
                      </span>
                      <input
                        type="number"
                        value={weightOverrides[ex.exerciseId] ?? ""}
                        min={0}
                        step={0.5}
                        placeholder="—"
                        onChange={(e) =>
                          setWeightOverrides((prev) => ({
                            ...prev,
                            [ex.exerciseId]:
                              e.target.value === ""
                                ? null
                                : parseFloat(e.target.value),
                          }))
                        }
                        className="w-24 h-7 bg-bg-page border border-border rounded-sm px-2 text-sm text-text-primary text-center focus:border-accent focus:outline-none"
                      />
                    </div>

                    {/* Tempo */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-text-primary opacity-50">
                        Tempo
                      </label>
                      <input
                        type="text"
                        value={tempoOverrides[ex.exerciseId] ?? ""}
                        placeholder="e.g. 3010"
                        maxLength={8}
                        onChange={(e) =>
                          setTempoOverrides((prev) => ({
                            ...prev,
                            [ex.exerciseId]: e.target.value,
                          }))
                        }
                        className="w-24 h-7 bg-bg-page border border-border rounded-sm px-2 text-xs text-text-primary text-center focus:border-accent focus:outline-none"
                      />
                    </div>

                    {/* Progression */}
                    <ProgressionDropdown
                      value={progressionOverrides[ex.exerciseId] ?? "none"}
                      onChange={(val) =>
                        setProgressionOverrides((prev) => ({
                          ...prev,
                          [ex.exerciseId]: val,
                        }))
                      }
                      buttonClassName="h-7 py-0 text-xs"
                    />

                    {/* RPE target — shown when progression = rpe */}
                    {progressionOverrides[ex.exerciseId] === "rpe" && (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-text-primary opacity-50">
                          Target RPE
                        </label>
                        <input
                          type="number"
                          value={rpeTargetOverrides[ex.exerciseId] ?? ""}
                          min={1}
                          max={10}
                          placeholder="1-10"
                          onChange={(e) =>
                            setRpeTargetOverrides((prev) => ({
                              ...prev,
                              [ex.exerciseId]: e.target.value,
                            }))
                          }
                          className="w-16 h-7 bg-bg-page border border-border rounded-sm px-2 text-sm text-text-primary text-center focus:border-accent focus:outline-none"
                        />
                      </div>
                    )}

                    {/* RIR target — shown when progression = rir */}
                    {progressionOverrides[ex.exerciseId] === "rir" && (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-text-primary opacity-50">
                          Target RIR
                        </label>
                        <input
                          type="number"
                          value={rirTargetOverrides[ex.exerciseId] ?? ""}
                          min={0}
                          max={5}
                          placeholder="0-5"
                          onChange={(e) =>
                            setRirTargetOverrides((prev) => ({
                              ...prev,
                              [ex.exerciseId]: e.target.value,
                            }))
                          }
                          className="w-16 h-7 bg-bg-page border border-border rounded-sm px-2 text-sm text-text-primary text-center focus:border-accent focus:outline-none"
                        />
                      </div>
                    )}

                    {/* kg/week increment — shown when progression = linear */}
                    {progressionOverrides[ex.exerciseId] === "linear" && (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-text-primary opacity-50">
                          +kg/week
                        </label>
                        <input
                          type="number"
                          value={weightIncrementOverrides[ex.exerciseId] ?? ""}
                          min={0}
                          step={0.5}
                          placeholder="e.g. 2.5"
                          onChange={(e) =>
                            setWeightIncrementOverrides((prev) => ({
                              ...prev,
                              [ex.exerciseId]: e.target.value,
                            }))
                          }
                          className="w-20 h-7 bg-bg-page border border-border rounded-sm px-2 text-sm text-text-primary text-center focus:border-accent focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Error + submit */}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleAssign}
        disabled={isPending || !confirmed}
        className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-sm py-2.5 text-sm font-semibold transition-colors cursor-pointer"
      >
        {isPending ? "Assigning..." : `Assign plan to ${traineeName}`}
      </button>
    </div>
  );
}
