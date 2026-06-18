import { Router, Request, Response } from "express";
import { db, sessionsTable, exerciseLogsTable, exercisesTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.userId, req.userId!))
    .orderBy(desc(sessionsTable.createdAt));
  res.json(sessions.map(s => ({ ...s, logs: [] })));
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const { totalExercises } = req.body;
  const today = new Date().toISOString().split("T")[0];
  const [session] = await db
    .insert(sessionsTable)
    .values({ userId: req.userId!, date: today, totalExercises: totalExercises || 16 })
    .returning();
  res.status(201).json({ ...session, logs: [] });
});

router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  const [session] = await db.select().from(sessionsTable).where(and(eq(sessionsTable.id, id), eq(sessionsTable.userId, req.userId!))).limit(1);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const logs = await db
    .select({
      id: exerciseLogsTable.id,
      sessionId: exerciseLogsTable.sessionId,
      exerciseId: exerciseLogsTable.exerciseId,
      exerciseName: exercisesTable.name,
      repsCompleted: exerciseLogsTable.repsCompleted,
      durationSeconds: exerciseLogsTable.durationSeconds,
      completedAt: exerciseLogsTable.completedAt,
    })
    .from(exerciseLogsTable)
    .leftJoin(exercisesTable, eq(exerciseLogsTable.exerciseId, exercisesTable.id))
    .where(eq(exerciseLogsTable.sessionId, id));
  res.json({ ...session, logs: logs.map(l => ({ ...l, completedAt: l.completedAt.toISOString(), exerciseName: l.exerciseName || "" })) });
});

router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  const { durationSeconds, completed } = req.body;
  const updates: Partial<typeof sessionsTable.$inferInsert> = {};
  if (durationSeconds !== undefined) updates.durationSeconds = durationSeconds;
  if (completed !== undefined) updates.completed = completed;

  const [session] = await db.update(sessionsTable).set(updates).where(and(eq(sessionsTable.id, id), eq(sessionsTable.userId, req.userId!))).returning();
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  if (completed) {
    const today = new Date().toISOString().split("T")[0];
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (user) {
      const lastDate = user.lastSessionDate;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      let newStreak = 1;
      if (lastDate === yesterdayStr || lastDate === today) {
        newStreak = lastDate === today ? user.currentStreak : user.currentStreak + 1;
      }
      const newLongest = Math.max(newStreak, user.longestStreak);
      const addedMinutes = Math.floor((durationSeconds || 0) / 60);
      await db.update(usersTable).set({
        currentStreak: newStreak,
        longestStreak: newLongest,
        totalMinutes: user.totalMinutes + addedMinutes,
        lastSessionDate: today,
      }).where(eq(usersTable.id, req.userId!));
    }
  }

  res.json({ ...session, logs: [] });
});

router.post("/:id/exercises", requireAuth, async (req: Request, res: Response) => {
  const sessionId = parseInt(req.params.id as string, 10);
  const { exerciseId, repsCompleted, durationSeconds } = req.body;

  const [log] = await db
    .insert(exerciseLogsTable)
    .values({ sessionId, exerciseId, repsCompleted, durationSeconds })
    .returning();

  const [exercise] = await db.select({ name: exercisesTable.name }).from(exercisesTable).where(eq(exercisesTable.id, exerciseId)).limit(1);

  const logs = await db.select().from(exerciseLogsTable).where(eq(exerciseLogsTable.sessionId, sessionId));
  const count = logs.length;
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId)).limit(1);
  if (session) {
    const pct = Math.round((count / session.totalExercises) * 100);
    await db.update(sessionsTable).set({ exercisesCompleted: count, completionPercent: pct }).where(eq(sessionsTable.id, sessionId));
  }

  res.status(201).json({
    ...log,
    exerciseName: exercise?.name || "",
    completedAt: log.completedAt.toISOString(),
  });
});

export default router;
