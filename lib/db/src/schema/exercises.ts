import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const exercisesTable = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  instructions: text("instructions").notNull(),
  reps: integer("reps"),
  durationSeconds: integer("duration_seconds"),
  rounds: integer("rounds"),
  exerciseType: text("exercise_type").notNull().default("reps"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertExerciseSchema = createInsertSchema(exercisesTable).omit({ id: true });
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercisesTable.$inferSelect;
