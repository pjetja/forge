import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NextPlanSection } from './_components/NextPlanSection';
import { PlanPicker } from './_components/PlanPicker';
import { TabSwitcher } from '@/components/TabSwitcher';
import { ExercisesTab } from './_components/ExercisesTab';
import { PhysicalStatsRow } from './_components/PhysicalStatsRow';
import { TrainerNotesEditor } from './_components/TrainerNotesEditor';
import { TraineeGoalsEditor } from './_components/TraineeGoalsEditor';
import { RequestBodyWeightAccessButton } from './_components/RequestBodyWeightAccessButton';
import { BodyWeightTab } from './_components/BodyWeightTab';
import { gravatarUrl } from '@/lib/gravatar';
import { GravatarAvatar } from '@/components/GravatarAvatar';
import { getTranslations } from 'next-intl/server';

interface AssignedPlanRow {
  id: string;
  name: string;
  week_count: number;
  workouts_per_week: number;
  status: string;
  started_at: string | null;
  plan_updated_at: string;
  created_at: string;
}

export default async function TraineeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ traineeId: string }>;
  searchParams?: Promise<{ tab?: string; q?: string; muscles?: string }>;
}) {
  const { traineeId } = await params;
  const resolvedSearch = await searchParams;
  const activeTab = ['exercises', 'goals', 'notes', 'body-weight'].includes(resolvedSearch?.tab ?? '')
    ? (resolvedSearch!.tab as string)
    : 'plans';
  const supabase = await createClient();

  const t = await getTranslations('trainer');

  // Fetch trainee profile
  const { data: traineeProfile } = await supabase
    .from('users')
    .select('name, email, goals, height_cm, weight_kg, date_of_birth')
    .eq('auth_uid', traineeId)
    .single();

  if (!traineeProfile) notFound();

  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;

  const { data: connectionRow } = await supabase
    .from('trainer_trainee_connections')
    .select('trainer_notes')
    .eq('trainer_auth_uid', claims?.sub ?? '')
    .eq('trainee_auth_uid', traineeId)
    .maybeSingle();

  // Fetch all assigned plans for this trainee (ordered newest first)
  const { data: assignedPlans } = await supabase
    .from('assigned_plans')
    .select('id, name, week_count, workouts_per_week, status, started_at, plan_updated_at, created_at')
    .eq('trainee_auth_uid', traineeId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  const plans = (assignedPlans ?? []) as AssignedPlanRow[];
  const activePlan = plans.find((p) => p.status === 'active') ?? null;
  const pendingPlans = plans.filter((p) => p.status === 'pending');
  const pastPlans = plans.filter((p) => p.status === 'completed' || p.status === 'terminated');

  // Fetch trainer's plan templates for the assign picker
  const { data: planTemplates } = await supabase
    .from('plans')
    .select('id, name, week_count, workouts_per_week')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // Check body weight access status for this trainee
  const { data: accessRequest } = await supabase
    .from('body_weight_access_requests')
    .select('id, status')
    .eq('trainer_auth_uid', claims?.sub ?? '')
    .eq('trainee_auth_uid', traineeId)
    .maybeSingle();

  const bodyWeightAccess = accessRequest?.status ?? null; // null | 'pending' | 'approved' | 'declined'

  // Fetch weight entries if access is approved (RLS policy grants trainer SELECT when approved)
  let weightEntries: Array<{ id: string; logged_date: string; weight_kg: string; created_at: string }> | null = null;
  if (bodyWeightAccess === 'approved') {
    const { data } = await supabase
      .from('body_weight_logs')
      .select('id, logged_date, weight_kg, created_at')
      .eq('trainee_auth_uid', traineeId)
      .order('logged_date', { ascending: false });
    weightEntries = data;
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/trainer" className="text-sm text-text-primary hover:text-accent transition-colors">
        &larr; {t('traineeDetail.backToAll')}
      </Link>

      <div className="pt-4" />

      {/* Trainee header */}
      <div className="flex items-center gap-4">
        <GravatarAvatar url={gravatarUrl(traineeProfile.email)} name={traineeProfile.name} size={48} />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{traineeProfile.name}</h1>
          <p className="text-sm text-text-primary">{traineeProfile.email}</p>
          <PhysicalStatsRow
            heightCm={traineeProfile.height_cm}
            weightKg={traineeProfile.weight_kg ? Number(traineeProfile.weight_kg) : null}
            dateOfBirth={traineeProfile.date_of_birth}
          />
        </div>
      </div>

      {/* Tab switcher */}
      <TabSwitcher
        tabs={[
          { key: 'plans', label: t('traineeDetail.tabs.plans') },
          { key: 'exercises', label: t('traineeDetail.tabs.exercises') },
          { key: 'goals', label: t('traineeDetail.tabs.goals') },
          { key: 'notes', label: t('traineeDetail.tabs.notes') },
          { key: 'body-weight', label: t('traineeDetail.tabs.bodyWeight') },
        ]}
        activeTab={activeTab}
      />

      {/* Plans tab content */}
      {activeTab === 'plans' && (
      <>
      {/* Persistent assign plan CTA — always visible when templates exist */}
      {(planTemplates ?? []).length > 0 && (
        <div className="flex justify-end">
          <Link
            href="/trainer/plans"
            className="inline-flex items-center gap-1.5 text-sm border border-border rounded-sm px-3 py-1.5 text-text-primary hover:border-accent hover:text-accent transition-colors"
          >
            + {t('traineeDetail.plans.assignPlan')}
          </Link>
        </div>
      )}

      {/* Current plan */}
      {(activePlan || pendingPlans.length === 0) && (
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">{t('traineeDetail.plans.currentPlan')}</h2>
        {activePlan ? (
          <div className="bg-bg-surface border border-border rounded-sm p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-text-primary">{activePlan.name}</p>
                <p className="text-sm text-text-primary mt-1">
                  {t('traineeDetail.plans.weeks', { count: activePlan.week_count })} &middot; {t('traineeDetail.plans.workoutsPerWeek', { count: activePlan.workouts_per_week })}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-accent/20 text-accent flex-shrink-0">
                {t('traineeDetail.plans.active')}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/trainer/trainees/${traineeId}/plans/${activePlan.id}`}
                className="inline-block text-sm text-accent hover:underline"
              >
                {t('traineeDetail.plans.viewPlan')}
              </Link>
              <Link
                href={`/trainer/trainees/${traineeId}/assigned-plans/${activePlan.id}/edit`}
                className="inline-block text-sm text-text-primary opacity-60 hover:opacity-100 hover:underline"
              >
                {t('traineeDetail.plans.editExercises')}
              </Link>
            </div>
          </div>
        ) : pendingPlans.length === 0 ? (
          <div className="bg-bg-surface border border-border rounded-sm p-4 space-y-3">
            <p className="text-sm text-text-primary opacity-60">{t('traineeDetail.plans.noplan')}</p>
            {(planTemplates ?? []).length === 0 ? (
              <p className="text-sm text-text-primary">
                {t('traineeDetail.plans.noPlansCreated')}{' '}
                <Link href="/trainer/plans/new" className="text-accent hover:underline">
                  {t('traineeDetail.plans.createFirst')}
                </Link>
              </p>
            ) : (
              <PlanPicker plans={planTemplates ?? []} traineeId={traineeId} />
            )}
          </div>
        ) : null}
      </section>
      )}

      {/* Next plan(s) — pending queue */}
      {(activePlan || pendingPlans.length > 0) && (
        <NextPlanSection
          traineeId={traineeId}
          pendingPlans={pendingPlans}
          planTemplates={planTemplates ?? []}
          hasActivePlan={!!activePlan}
        />
      )}

      {/* Past plans */}
      {pastPlans.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">{t('traineeDetail.plans.pastPlans')}</h2>
          <div className="space-y-2">
            {pastPlans.map((plan) =>
              plan.status === 'completed' ? (
                <Link
                  key={plan.id}
                  href={`/trainer/trainees/${traineeId}/plans/${plan.id}`}
                  className="bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between hover:border-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-text-primary">{plan.name}</p>
                    <p className="text-xs text-text-primary opacity-60 mt-1">
                      {t('traineeDetail.plans.weeks', { count: plan.week_count })} &middot; {t('traineeDetail.plans.completed')}
                    </p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-text-primary opacity-40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ) : (
                <div
                  key={plan.id}
                  className="bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-text-primary">{plan.name}</p>
                    <p className="text-xs text-text-primary opacity-60 mt-1">
                      {t('traineeDetail.plans.weeks', { count: plan.week_count })} &middot; {t('traineeDetail.plans.terminated')}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}
      {/* Body weight access request button — shown on Plans tab */}
      <>
      </>
      </>
      )}

      {/* Exercises tab content */}
      {activeTab === 'exercises' && (
        <ExercisesTab
          traineeId={traineeId}
          searchQuery={resolvedSearch?.q ?? ''}
          muscleFilter={resolvedSearch?.muscles ?? ''}
        />
      )}

      {/* Goals tab content */}
      {activeTab === 'goals' && (
        <TraineeGoalsEditor
          traineeId={traineeId}
          initialGoals={traineeProfile.goals ?? ''}
        />
      )}

      {/* Notes tab content */}
      {activeTab === 'notes' && (
        <TrainerNotesEditor
          traineeId={traineeId}
          initialNotes={connectionRow?.trainer_notes ?? ''}
        />
      )}

      {/* Body Weight tab content */}
      {activeTab === 'body-weight' && (
        bodyWeightAccess === 'approved' && weightEntries
          ? <BodyWeightTab entries={weightEntries} traineeId={traineeId} />
          : <div className="space-y-3">
              <RequestBodyWeightAccessButton
                traineeId={traineeId}
                accessStatus={bodyWeightAccess}
              />
              {bodyWeightAccess === null && (
                <p className="text-sm text-text-primary opacity-60">{t('traineeDetail.bodyWeight.requestExplanation')}</p>
              )}
            </div>
      )}
    </div>
  );
}
