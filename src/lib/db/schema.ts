import { pgTable, uuid, text, timestamp, unique, integer, numeric, jsonb } from 'drizzle-orm/pg-core';

export const trainers = pgTable('trainers', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUid: uuid('auth_uid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Trainee profiles (and any future non-trainer roles)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUid: uuid('auth_uid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role', { enum: ['trainee'] }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const inviteLinks = pgTable('invite_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerAuthUid: uuid('trainer_auth_uid').notNull(),
  token: text('token').notNull().unique(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const trainerTraineeConnections = pgTable('trainer_trainee_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerAuthUid: uuid('trainer_auth_uid').notNull(),
  traineeAuthUid: uuid('trainee_auth_uid').notNull(),
  inviteLinkId: uuid('invite_link_id'),
  connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // CRITICAL: enforces one trainer per trainee at the database level
  // Race conditions cannot produce two connections for the same trainee
  uniqueTrainee: unique('trainee_unique_connection').on(table.traineeAuthUid),
}));

export const MUSCLE_GROUPS = [
  'Chest', 'Upper Back', 'Lats', 'Front Delts', 'Side Delts', 'Rear Delts',
  'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core',
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerAuthUid: uuid('trainer_auth_uid').notNull(),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group').notNull(),
  description: text('description'),
  notes: text('notes'),
  videoUrl: text('video_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;

// ── Phase 3: Plan Builder ─────────────────────────────────────────────────────

export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerAuthUid: uuid('trainer_auth_uid').notNull(),
  name: text('name').notNull(),
  weekCount: integer('week_count').notNull(),
  workoutsPerWeek: integer('workouts_per_week').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const workoutSchemas = pgTable('workout_schemas', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slotIndex: integer('slot_index').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const schemaExercises = pgTable('schema_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  schemaId: uuid('schema_id').notNull().references(() => workoutSchemas.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id, { onDelete: 'restrict' }),
  sortOrder: integer('sort_order').notNull().default(0),
  sets: integer('sets').notNull().default(3),
  reps: integer('reps').notNull().default(10),
  targetWeightKg: numeric('target_weight_kg', { precision: 6, scale: 2 }),
  perSetWeights: jsonb('per_set_weights'), // number[] | null
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const assignedPlans = pgTable('assigned_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourcePlanId: uuid('source_plan_id').references(() => plans.id, { onDelete: 'set null' }),
  trainerAuthUid: uuid('trainer_auth_uid').notNull(),
  traineeAuthUid: uuid('trainee_auth_uid').notNull(),
  name: text('name').notNull(),
  weekCount: integer('week_count').notNull(),
  workoutsPerWeek: integer('workouts_per_week').notNull(),
  status: text('status', { enum: ['pending', 'active', 'completed', 'terminated'] }).notNull().default('pending'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  planUpdatedAt: timestamp('plan_updated_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const assignedSchemas = pgTable('assigned_schemas', {
  id: uuid('id').primaryKey().defaultRandom(),
  assignedPlanId: uuid('assigned_plan_id').notNull().references(() => assignedPlans.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slotIndex: integer('slot_index').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const assignedSchemaExercises = pgTable('assigned_schema_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  assignedSchemaId: uuid('assigned_schema_id').notNull().references(() => assignedSchemas.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id, { onDelete: 'restrict' }),
  sortOrder: integer('sort_order').notNull().default(0),
  sets: integer('sets').notNull().default(3),
  reps: integer('reps').notNull().default(10),
  targetWeightKg: numeric('target_weight_kg', { precision: 6, scale: 2 }),
  perSetWeights: jsonb('per_set_weights'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Inferred types (used throughout Phase 3)
export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
export type WorkoutSchema = typeof workoutSchemas.$inferSelect;
export type SchemaExercise = typeof schemaExercises.$inferSelect;
export type AssignedPlan = typeof assignedPlans.$inferSelect;
export type AssignedSchema = typeof assignedSchemas.$inferSelect;
export type AssignedSchemaExercise = typeof assignedSchemaExercises.$inferSelect;

// Composite types used in UI
export type SchemaWithExercises = WorkoutSchema & {
  exercises: (SchemaExercise & { exercise: Exercise })[];
};
export type PlanWithSchemas = Plan & { schemas: SchemaWithExercises[] };
export type AssignedPlanWithSchemas = AssignedPlan & {
  schemas: (AssignedSchema & {
    exercises: (AssignedSchemaExercise & { exercise: Exercise })[];
  })[];
};
