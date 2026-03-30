import { config } from "dotenv";
config({ path: ".env.local" });

import { createAdminClient } from "../src/lib/supabase/admin";

// ── Section A: Config constants ───────────────────────────────────────────────

const DEMO_TRAINER_EMAIL = "demo-trainer@trainerforge.app";
const DEMO_TRAINER_PASSWORD = "DemoTrainer2026!";
const DEMO_TRAINEE_EMAIL = "demo-trainee@trainerforge.app";
const DEMO_TRAINEE_PASSWORD = "DemoTrainee2026!";

// ── Date helpers ──────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysAgoDate(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0]!; // 'YYYY-MM-DD'
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const adminClient = createAdminClient();

  // ── Section B: Idempotency check ─────────────────────────────────────────

  const { data: existingTrainer } = await adminClient
    .from("trainers")
    .select("auth_uid")
    .eq("email", DEMO_TRAINER_EMAIL)
    .maybeSingle();

  if (existingTrainer) {
    console.log("✓ Demo users already seeded — nothing to do.");
    process.exit(0);
  }

  console.log("Seeding demo users...");

  // ── Section C: Create Supabase auth users ─────────────────────────────────

  const { data: trainerAuthData, error: trainerAuthError } =
    await adminClient.auth.admin.createUser({
      email: DEMO_TRAINER_EMAIL,
      password: DEMO_TRAINER_PASSWORD,
      email_confirm: true,
      app_metadata: { role: "trainer" },
      user_metadata: { is_demo: true },
    });
  if (trainerAuthError || !trainerAuthData.user) {
    throw new Error(
      `Failed to create demo trainer auth user: ${trainerAuthError?.message}`,
    );
  }
  const trainerUid = trainerAuthData.user.id;
  console.log(`  ✓ Demo trainer auth user created: ${trainerUid}`);

  const { data: traineeAuthData, error: traineeAuthError } =
    await adminClient.auth.admin.createUser({
      email: DEMO_TRAINEE_EMAIL,
      password: DEMO_TRAINEE_PASSWORD,
      email_confirm: true,
      app_metadata: { role: "trainee" },
      user_metadata: { is_demo: true },
    });
  if (traineeAuthError || !traineeAuthData.user) {
    throw new Error(
      `Failed to create demo trainee auth user: ${traineeAuthError?.message}`,
    );
  }
  const traineeUid = traineeAuthData.user.id;
  console.log(`  ✓ Demo trainee auth user created: ${traineeUid}`);

  // ── Section D: Profile rows + connection ─────────────────────────────────

  const { error: trainerRowError } = await adminClient.from("trainers").insert({
    auth_uid: trainerUid,
    name: "Demo Trainer",
    email: DEMO_TRAINER_EMAIL,
    bio: "Demo account — explore all trainer features.",
  });
  if (trainerRowError)
    throw new Error(`Insert trainers: ${trainerRowError.message}`);

  const { error: traineeRowError } = await adminClient.from("users").insert({
    auth_uid: traineeUid,
    name: "Demo Trainee",
    email: DEMO_TRAINEE_EMAIL,
    role: "trainee",
    goals: "Build strength and reduce body fat",
  });
  if (traineeRowError)
    throw new Error(`Insert users: ${traineeRowError.message}`);

  const { error: connError } = await adminClient
    .from("trainer_trainee_connections")
    .insert({ trainer_auth_uid: trainerUid, trainee_auth_uid: traineeUid });
  if (connError) throw new Error(`Insert connection: ${connError.message}`);

  console.log("  ✓ Profile rows and connection created");

  // ── Section E: Exercises ─────────────────────────────────────────────────

  const exerciseRows = [
    // Push
    {
      trainer_auth_uid: trainerUid,
      name: "Barbell Bench Press",
      muscle_group: "Chest",
      description: "Classic horizontal push compound movement.",
    },
    {
      trainer_auth_uid: trainerUid,
      name: "Overhead Press",
      muscle_group: "Front Delts",
      description: "Standing or seated barbell press overhead.",
    },
    {
      trainer_auth_uid: trainerUid,
      name: "Tricep Pushdown",
      muscle_group: "Triceps",
      description: "Cable pushdown with rope or straight bar.",
    },
    {
      trainer_auth_uid: trainerUid,
      name: "Lateral Raise",
      muscle_group: "Side Delts",
      description: "Dumbbell lateral raise for shoulder width.",
    },
    // Pull
    {
      trainer_auth_uid: trainerUid,
      name: "Barbell Row",
      muscle_group: "Upper Back",
      description: "Bent-over row for upper back thickness.",
    },
    {
      trainer_auth_uid: trainerUid,
      name: "Pull-up",
      muscle_group: "Lats",
      description: "Bodyweight pull-up. Use 0 kg as base weight.",
    },
    {
      trainer_auth_uid: trainerUid,
      name: "Bicep Curl",
      muscle_group: "Biceps",
      description: "Dumbbell or barbell curl.",
    },
    // Legs
    {
      trainer_auth_uid: trainerUid,
      name: "Squat",
      muscle_group: "Quads",
      description: "Back squat, king of leg exercises.",
    },
    {
      trainer_auth_uid: trainerUid,
      name: "Romanian Deadlift",
      muscle_group: "Hamstrings",
      description: "Hip-hinge movement for hamstring development.",
    },
    {
      trainer_auth_uid: trainerUid,
      name: "Leg Press",
      muscle_group: "Quads",
      description: "Machine leg press.",
    },
  ];

  const { data: exerciseData, error: exError } = await adminClient
    .from("exercises")
    .insert(exerciseRows)
    .select("id, name");
  if (exError || !exerciseData)
    throw new Error(`Insert exercises: ${exError?.message}`);

  const exByName = Object.fromEntries(
    exerciseData.map((e) => [e.name, e.id]),
  ) as Record<string, string>;
  console.log(`  ✓ ${exerciseData.length} exercises created`);

  // ── Section F: Plan + schemas + schema exercises ──────────────────────────

  const { data: planData, error: planError } = await adminClient
    .from("plans")
    .insert({
      trainer_auth_uid: trainerUid,
      name: "Push/Pull/Legs Program",
      week_count: 4,
      workouts_per_week: 3,
      status: "active",
      tags: [],
    })
    .select("id")
    .single();
  if (planError || !planData)
    throw new Error(`Insert plan: ${planError?.message}`);
  const planId = planData.id;

  const { data: schemaData, error: schemaError } = await adminClient
    .from("workout_schemas")
    .insert([
      { plan_id: planId, name: "Push Day", slot_index: 0, sort_order: 0 },
      { plan_id: planId, name: "Pull Day", slot_index: 1, sort_order: 1 },
      { plan_id: planId, name: "Legs Day", slot_index: 2, sort_order: 2 },
    ])
    .select("id, name");
  if (schemaError || !schemaData)
    throw new Error(`Insert workout_schemas: ${schemaError?.message}`);

  const schemaByName = Object.fromEntries(
    schemaData.map((s) => [s.name, s.id]),
  ) as Record<string, string>;

  type SchemaExRow = {
    schema_id: string;
    exercise_id: string;
    sort_order: number;
    sets: number;
    reps: number;
    target_weight_kg: number | null;
  };

  const schemaExRows: SchemaExRow[] = [
    // Push Day
    {
      schema_id: schemaByName["Push Day"]!,
      exercise_id: exByName["Barbell Bench Press"]!,
      sort_order: 0,
      sets: 4,
      reps: 8,
      target_weight_kg: 80,
    },
    {
      schema_id: schemaByName["Push Day"]!,
      exercise_id: exByName["Overhead Press"]!,
      sort_order: 1,
      sets: 3,
      reps: 8,
      target_weight_kg: 55,
    },
    {
      schema_id: schemaByName["Push Day"]!,
      exercise_id: exByName["Tricep Pushdown"]!,
      sort_order: 2,
      sets: 3,
      reps: 12,
      target_weight_kg: 30,
    },
    {
      schema_id: schemaByName["Push Day"]!,
      exercise_id: exByName["Lateral Raise"]!,
      sort_order: 3,
      sets: 3,
      reps: 15,
      target_weight_kg: 10,
    },
    // Pull Day
    {
      schema_id: schemaByName["Pull Day"]!,
      exercise_id: exByName["Barbell Row"]!,
      sort_order: 0,
      sets: 4,
      reps: 8,
      target_weight_kg: 75,
    },
    {
      schema_id: schemaByName["Pull Day"]!,
      exercise_id: exByName["Pull-up"]!,
      sort_order: 1,
      sets: 3,
      reps: 8,
      target_weight_kg: null,
    },
    {
      schema_id: schemaByName["Pull Day"]!,
      exercise_id: exByName["Bicep Curl"]!,
      sort_order: 2,
      sets: 3,
      reps: 12,
      target_weight_kg: 15,
    },
    // Legs Day
    {
      schema_id: schemaByName["Legs Day"]!,
      exercise_id: exByName["Squat"]!,
      sort_order: 0,
      sets: 4,
      reps: 8,
      target_weight_kg: 100,
    },
    {
      schema_id: schemaByName["Legs Day"]!,
      exercise_id: exByName["Romanian Deadlift"]!,
      sort_order: 1,
      sets: 3,
      reps: 10,
      target_weight_kg: 85,
    },
    {
      schema_id: schemaByName["Legs Day"]!,
      exercise_id: exByName["Leg Press"]!,
      sort_order: 2,
      sets: 3,
      reps: 12,
      target_weight_kg: 120,
    },
  ];

  const { error: schExError } = await adminClient
    .from("schema_exercises")
    .insert(schemaExRows);
  if (schExError)
    throw new Error(`Insert schema_exercises: ${schExError.message}`);

  console.log("  ✓ Plan, schemas, and schema exercises created");

  // ── Section G: Assigned plan snapshot ────────────────────────────────────

  const { data: apData, error: apError } = await adminClient
    .from("assigned_plans")
    .insert({
      source_plan_id: planId,
      trainer_auth_uid: trainerUid,
      trainee_auth_uid: traineeUid,
      name: "Push/Pull/Legs Program",
      week_count: 4,
      workouts_per_week: 3,
      status: "active",
      started_at: daysAgo(14),
      sort_order: 0,
    })
    .select("id")
    .single();
  if (apError || !apData)
    throw new Error(`Insert assigned_plans: ${apError?.message}`);
  const assignedPlanId = apData.id;

  // Assigned schemas
  const { data: asData, error: asError } = await adminClient
    .from("assigned_schemas")
    .insert([
      {
        assigned_plan_id: assignedPlanId,
        name: "Push Day",
        slot_index: 0,
        sort_order: 0,
      },
      {
        assigned_plan_id: assignedPlanId,
        name: "Pull Day",
        slot_index: 1,
        sort_order: 1,
      },
      {
        assigned_plan_id: assignedPlanId,
        name: "Legs Day",
        slot_index: 2,
        sort_order: 2,
      },
    ])
    .select("id, name");
  if (asError || !asData)
    throw new Error(`Insert assigned_schemas: ${asError?.message}`);

  const asByName = Object.fromEntries(
    asData.map((s) => [s.name, s.id]),
  ) as Record<string, string>;

  type AssignedExRow = {
    assigned_schema_id: string;
    exercise_id: string;
    sort_order: number;
    sets: number;
    reps: number;
    target_weight_kg: number | null;
  };

  // Assigned schema exercises — mirrors schema_exercises but references assigned_schema_id
  const assignedExRows: AssignedExRow[] = [
    // Push Day
    {
      assigned_schema_id: asByName["Push Day"]!,
      exercise_id: exByName["Barbell Bench Press"]!,
      sort_order: 0,
      sets: 4,
      reps: 8,
      target_weight_kg: 80,
    },
    {
      assigned_schema_id: asByName["Push Day"]!,
      exercise_id: exByName["Overhead Press"]!,
      sort_order: 1,
      sets: 3,
      reps: 8,
      target_weight_kg: 55,
    },
    {
      assigned_schema_id: asByName["Push Day"]!,
      exercise_id: exByName["Tricep Pushdown"]!,
      sort_order: 2,
      sets: 3,
      reps: 12,
      target_weight_kg: 30,
    },
    {
      assigned_schema_id: asByName["Push Day"]!,
      exercise_id: exByName["Lateral Raise"]!,
      sort_order: 3,
      sets: 3,
      reps: 15,
      target_weight_kg: 10,
    },
    // Pull Day
    {
      assigned_schema_id: asByName["Pull Day"]!,
      exercise_id: exByName["Barbell Row"]!,
      sort_order: 0,
      sets: 4,
      reps: 8,
      target_weight_kg: 75,
    },
    {
      assigned_schema_id: asByName["Pull Day"]!,
      exercise_id: exByName["Pull-up"]!,
      sort_order: 1,
      sets: 3,
      reps: 8,
      target_weight_kg: null,
    },
    {
      assigned_schema_id: asByName["Pull Day"]!,
      exercise_id: exByName["Bicep Curl"]!,
      sort_order: 2,
      sets: 3,
      reps: 12,
      target_weight_kg: 15,
    },
    // Legs Day
    {
      assigned_schema_id: asByName["Legs Day"]!,
      exercise_id: exByName["Squat"]!,
      sort_order: 0,
      sets: 4,
      reps: 8,
      target_weight_kg: 100,
    },
    {
      assigned_schema_id: asByName["Legs Day"]!,
      exercise_id: exByName["Romanian Deadlift"]!,
      sort_order: 1,
      sets: 3,
      reps: 10,
      target_weight_kg: 85,
    },
    {
      assigned_schema_id: asByName["Legs Day"]!,
      exercise_id: exByName["Leg Press"]!,
      sort_order: 2,
      sets: 3,
      reps: 12,
      target_weight_kg: 120,
    },
  ];

  const { data: aseData, error: aseError } = await adminClient
    .from("assigned_schema_exercises")
    .insert(assignedExRows)
    .select("id, exercise_id, assigned_schema_id");
  if (aseError || !aseData)
    throw new Error(`Insert assigned_schema_exercises: ${aseError?.message}`);

  // Build lookup: exerciseId + assignedSchemaId → assignedSchemaExerciseId
  const aseById = (exerciseName: string, schemaName: string): string => {
    const exId = exByName[exerciseName]!;
    const asId = asByName[schemaName]!;
    const row = aseData.find(
      (r) => r.exercise_id === exId && r.assigned_schema_id === asId,
    );
    if (!row)
      throw new Error(`ASE not found for ${exerciseName} in ${schemaName}`);
    return row.id;
  };

  console.log("  ✓ Assigned plan snapshot created");

  // ── Section H: Workout sessions with sets ────────────────────────────────

  type SessionSpec = {
    dayOffset: number;
    schemaName: string;
    exercises: Array<{
      name: string;
      targetReps: number;
      weights: [number, number];
    }>;
  };

  // Progressive overload: session1Weight vs session2Weight per exercise
  const sessions: SessionSpec[] = [
    {
      dayOffset: 14,
      schemaName: "Push Day",
      exercises: [
        { name: "Barbell Bench Press", targetReps: 8, weights: [80, 82.5] },
        { name: "Overhead Press", targetReps: 8, weights: [55, 57.5] },
        { name: "Tricep Pushdown", targetReps: 12, weights: [30, 32.5] },
        { name: "Lateral Raise", targetReps: 15, weights: [10, 12] },
      ],
    },
    {
      dayOffset: 12,
      schemaName: "Pull Day",
      exercises: [
        { name: "Barbell Row", targetReps: 8, weights: [75, 77.5] },
        { name: "Pull-up", targetReps: 8, weights: [0, 0] },
        { name: "Bicep Curl", targetReps: 12, weights: [15, 17.5] },
      ],
    },
    {
      dayOffset: 10,
      schemaName: "Legs Day",
      exercises: [
        { name: "Squat", targetReps: 8, weights: [100, 102.5] },
        { name: "Romanian Deadlift", targetReps: 10, weights: [85, 87.5] },
        { name: "Leg Press", targetReps: 12, weights: [120, 122.5] },
      ],
    },
    {
      dayOffset: 7,
      schemaName: "Push Day",
      exercises: [
        { name: "Barbell Bench Press", targetReps: 8, weights: [80, 82.5] },
        { name: "Overhead Press", targetReps: 8, weights: [55, 57.5] },
        { name: "Tricep Pushdown", targetReps: 12, weights: [30, 32.5] },
        { name: "Lateral Raise", targetReps: 15, weights: [10, 12] },
      ],
    },
    {
      dayOffset: 5,
      schemaName: "Pull Day",
      exercises: [
        { name: "Barbell Row", targetReps: 8, weights: [75, 77.5] },
        { name: "Pull-up", targetReps: 8, weights: [0, 0] },
        { name: "Bicep Curl", targetReps: 12, weights: [15, 17.5] },
      ],
    },
    {
      dayOffset: 3,
      schemaName: "Legs Day",
      exercises: [
        { name: "Squat", targetReps: 8, weights: [100, 102.5] },
        { name: "Romanian Deadlift", targetReps: 10, weights: [85, 87.5] },
        { name: "Leg Press", targetReps: 12, weights: [120, 122.5] },
      ],
    },
  ];

  // Track which session index (0 or 1) each schema has seen for progressive overload
  const schemaSessionCount: Record<string, number> = {
    "Push Day": 0,
    "Pull Day": 0,
    "Legs Day": 0,
  };

  for (const session of sessions) {
    const assignedSchemaId = asByName[session.schemaName]!;
    const sessionIndex = schemaSessionCount[session.schemaName]!;
    schemaSessionCount[session.schemaName]!++;

    const { data: sessionRow, error: sessionError } = await adminClient
      .from("workout_sessions")
      .insert({
        assigned_schema_id: assignedSchemaId,
        trainee_auth_uid: traineeUid,
        status: "completed",
        started_at: daysAgo(session.dayOffset),
        completed_at: daysAgo(session.dayOffset),
      })
      .select("id")
      .single();
    if (sessionError || !sessionRow) {
      throw new Error(
        `Insert workout_session (day -${session.dayOffset}): ${sessionError?.message}`,
      );
    }
    const sessionId = sessionRow.id;

    // Build sets for all exercises in this session
    const setRows: {
      session_id: string;
      assigned_schema_exercise_id: string;
      set_number: number;
      actual_reps: number;
      actual_weight_kg: number;
      completed_at: string;
    }[] = [];

    for (const ex of session.exercises) {
      // Determine sets count from schema exercises spec
      const setsSpec: Record<string, number> = {
        "Barbell Bench Press": 4,
        "Overhead Press": 3,
        "Tricep Pushdown": 3,
        "Lateral Raise": 3,
        "Barbell Row": 4,
        "Pull-up": 3,
        "Bicep Curl": 3,
        Squat: 4,
        "Romanian Deadlift": 3,
        "Leg Press": 3,
      };
      const numSets = setsSpec[ex.name] ?? 3;
      const weight = ex.weights[sessionIndex] ?? ex.weights[0]!;
      const aseId = aseById(ex.name, session.schemaName);

      for (let s = 1; s <= numSets; s++) {
        setRows.push({
          session_id: sessionId,
          assigned_schema_exercise_id: aseId,
          set_number: s,
          actual_reps: ex.targetReps,
          actual_weight_kg: weight,
          completed_at: daysAgo(session.dayOffset),
        });
      }
    }

    const { error: setsError } = await adminClient
      .from("session_sets")
      .insert(setRows);
    if (setsError)
      throw new Error(
        `Insert session_sets (day -${session.dayOffset}): ${setsError.message}`,
      );
  }

  console.log("  ✓ 6 workout sessions with sets created");

  // ── Section I: Body weight logs ───────────────────────────────────────────

  // Daily entries from day -14 to day -1, slight downward trend ~84.2 → 83.5
  const bodyWeights = [
    84.2, 84.0, 83.9, 84.1, 83.8, 83.7, 84.0, 83.7, 83.6, 83.8, 83.5, 83.6,
    83.4, 83.5,
  ];

  const bwRows = bodyWeights.map((weight, i) => ({
    trainee_auth_uid: traineeUid,
    logged_date: daysAgoDate(14 - i), // day -14 to day -1
    weight_kg: weight,
  }));

  const { error: bwError } = await adminClient
    .from("body_weight_logs")
    .insert(bwRows);
  if (bwError) throw new Error(`Insert body_weight_logs: ${bwError.message}`);

  console.log("  ✓ 14 body weight log entries created");
  console.log("✓ Demo users seeded successfully!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
