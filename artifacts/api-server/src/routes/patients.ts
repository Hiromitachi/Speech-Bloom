import { Router, Request, Response } from "express";
import { db, usersTable, therapistPatientsTable, sessionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const relationships = await db.select({ patientId: therapistPatientsTable.patientId })
    .from(therapistPatientsTable)
    .where(eq(therapistPatientsTable.therapistId, req.userId!));

  const patientIds = relationships.map(r => r.patientId);
  if (patientIds.length === 0) { res.json([]); return; }

  const patients = [];
  for (const pid of patientIds) {
    const [patient] = await db.select().from(usersTable).where(eq(usersTable.id, pid)).limit(1);
    if (!patient) continue;
    const sessions = await db.select().from(sessionsTable).where(eq(sessionsTable.userId, pid)).orderBy(desc(sessionsTable.createdAt));
    const lastSession = sessions[0]?.date || null;
    const completionPercent = sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + s.completionPercent, 0) / sessions.length) : 0;
    patients.push({
      id: patient.id,
      name: patient.name,
      email: patient.email,
      lastSession,
      currentStreak: patient.currentStreak,
      completionPercent,
      totalSessions: sessions.length,
    });
  }
  res.json(patients);
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) { res.status(400).json({ error: "Email is required" }); return; }

  let [patient] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!patient) {
    const [newPatient] = await db.insert(usersTable).values({ email, name: name || email.split("@")[0], role: "patient" }).returning();
    patient = newPatient;
  }

  await db.insert(therapistPatientsTable).values({ therapistId: req.userId!, patientId: patient.id }).onConflictDoNothing();

  res.status(201).json({
    id: patient.id,
    name: patient.name,
    email: patient.email,
    lastSession: null,
    currentStreak: patient.currentStreak,
    completionPercent: 0,
    totalSessions: 0,
  });
});

router.get("/:id/progress", requireAuth, async (req: Request, res: Response) => {
  const patientId = parseInt(req.params.id, 10);
  const [patient] = await db.select().from(usersTable).where(eq(usersTable.id, patientId)).limit(1);
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

  const sessions = await db.select().from(sessionsTable).where(eq(sessionsTable.userId, patientId));
  const totalSessions = sessions.length;
  const totalExercisesCompleted = sessions.reduce((a, s) => a + s.exercisesCompleted, 0);
  const today = new Date().toISOString().split("T")[0];
  const todaySession = sessions.find(s => s.date === today);
  const todayCompletionPercent = todaySession?.completionPercent ?? 0;

  const week: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    week.push(d.toISOString().split("T")[0]);
  }
  const weekDaysWithSession = new Set(sessions.filter(s => week.includes(s.date)).map(s => s.date)).size;
  const weeklyGoalPercent = Math.min(100, Math.round((weekDaysWithSession / 7) * 100));

  res.json({
    totalSessions,
    currentStreak: patient.currentStreak,
    longestStreak: patient.longestStreak,
    totalMinutes: patient.totalMinutes,
    totalExercisesCompleted,
    todayCompletionPercent,
    weeklyGoalPercent,
    mostImprovedCategory: "Breathing",
  });
});

export default router;
