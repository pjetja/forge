'use client';
import { useState } from 'react';
import { AssignPlanModal } from '../../../_components/AssignPlanModal';

interface Trainee {
  authUid: string;
  name: string;
  email: string;
}

interface ExerciseForReview {
  schemaExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  templateWeightKg: number | null;
  templatePerSetWeights: number[] | null;
}

interface AssignPlanClientPageProps {
  planId: string;
  planName: string;
  trainees: Trainee[];
  traineesWithActivePlan: string[];
  exercises: ExerciseForReview[];
}

export function AssignPlanClientPage({
  planId,
  planName: _planName,
  trainees,
  traineesWithActivePlan,
  exercises,
}: AssignPlanClientPageProps) {
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const activePlanSet = new Set(traineesWithActivePlan);

  if (trainees.length === 0) {
    return (
      <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
        <p className="text-sm text-text-primary opacity-60">No trainees connected yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {trainees.map((trainee) => {
          const hasActivePlan = activePlanSet.has(trainee.authUid);
          return (
            <button
              key={trainee.authUid}
              type="button"
              onClick={() => setSelectedTrainee(trainee)}
              className="w-full text-left bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between hover:border-accent transition-colors cursor-pointer"
            >
              <div>
                <p className="font-medium text-text-primary">{trainee.name}</p>
                <p className="text-sm text-text-primary opacity-60">{trainee.email}</p>
              </div>
              {hasActivePlan && (
                <span className="text-xs bg-yellow-900/40 text-yellow-300 px-2 py-0.5 rounded-full flex-shrink-0">
                  Has active plan
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedTrainee && (
        <AssignPlanModal
          planId={planId}
          traineeAuthUid={selectedTrainee.authUid}
          traineeName={selectedTrainee.name}
          hasExistingActivePlan={activePlanSet.has(selectedTrainee.authUid)}
          exercises={exercises}
          exerciseHistory={{}} // Phase 3: no history. Phase 4 will inject real data here.
          onClose={() => setSelectedTrainee(null)}
        />
      )}
    </>
  );
}
