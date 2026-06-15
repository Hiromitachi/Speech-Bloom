import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const therapistPatientsTable = pgTable("therapist_patients", {
  id: serial("id").primaryKey(),
  therapistId: integer("therapist_id").notNull().references(() => usersTable.id),
  patientId: integer("patient_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTherapistPatientSchema = createInsertSchema(therapistPatientsTable).omit({ id: true, createdAt: true });
export type InsertTherapistPatient = z.infer<typeof insertTherapistPatientSchema>;
export type TherapistPatient = typeof therapistPatientsTable.$inferSelect;
