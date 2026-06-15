import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sessionsTable } from "./sessions";
import { exercisesTable } from "./exercises";

export const exerciseLogsTable = pgTable("exercise_logs", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id),
  exerciseId: integer("exercise_id").notNull().references(() => exercisesTable.id),
  repsCompleted: integer("reps_completed"),
  durationSeconds: integer("duration_seconds"),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertExerciseLogSchema = createInsertSchema(exerciseLogsTable).omit({ id: true, completedAt: true });
export type InsertExerciseLog = z.infer<typeof insertExerciseLogSchema>;
export type ExerciseLog = typeof exerciseLogsTable.$inferSelect;
