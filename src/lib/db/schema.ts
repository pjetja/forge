import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';

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
