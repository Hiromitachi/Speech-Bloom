import { Router, Request, Response } from "express";
import { db, sessionsTable, exerciseLogsTable, exercisesTable, usersTable } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/summary", requireAuth, async (req: Request, res: Response) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const sessions = await db.select().from(sessionsTable).where(eq(sessionsTable.userId, req.userId!));
  const totalSessions = sessions.length;
  const totalExercisesCompleted = sessions.reduce((acc, s) => acc + s.exercisesCompleted, 0);

  const today = new Date().toISOString().split("T")[0];
  const todaySession = sessions.find(s => s.date === today);
  const todayCompletionPercent = todaySession?.completionPercent ?? 0;

  const week: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    week.push(d.toISOString().split("T")[0]);
  }
  const weekSessions = sessions.filter(s => week.includes(s.date));
  const weekDaysWithSession = new Set(weekSessions.map(s => s.date)).size;
  const weeklyGoalPercent = Math.min(100, Math.round((weekDaysWithSession / 7) * 100));

  const categoryLogs = await db
    .select({ category: exercisesTable.category })
    .from(exerciseLogsTable)
    .leftJoin(exercisesTable, eq(exerciseLogsTable.exerciseId, exercisesTable.id))
    .leftJoin(sessionsTable, eq(exerciseLogsTable.sessionId, sessionsTable.id))
    .where(eq(sessionsTable.userId, req.userId!));

  const catCounts: Record<string, number> = {};
  for (const row of categoryLogs) {
    if (row.category) catCounts[row.category] = (catCounts[row.category] || 0) + 1;
  }
  const mostImprovedCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Breathing";

  res.json({
    totalSessions,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    totalMinutes: user.totalMinutes,
    totalExercisesCompleted,
    todayCompletionPercent,
    weeklyGoalPercent,
    mostImprovedCategory,
  });
});

router.get("/weekly", requireAuth, async (req: Request, res: Response) => {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const daySessions = await db.select().from(sessionsTable).where(and(eq(sessionsTable.userId, req.userId!), eq(sessionsTable.date, dateStr)));
    const minutesPracticed = daySessions.reduce((acc, s) => acc + Math.floor(s.durationSeconds / 60), 0);
    const exercisesCompleted = daySessions.reduce((acc, s) => acc + s.exercisesCompleted, 0);
    result.push({ date: dateStr, minutesPracticed, exercisesCompleted, sessionCount: daySessions.length });
  }
  res.json(result);
});

router.get("/heatmap", requireAuth, async (req: Request, res: Response) => {
  const sessions = await db.select({ date: sessionsTable.date, completed: sessionsTable.completed })
    .from(sessionsTable).where(eq(sessionsTable.userId, req.userId!));
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    counts[s.date] = (counts[s.date] || 0) + 1;
  }
  const result = Object.entries(counts).map(([date, count]) => ({ date, count }));
  res.json(result);
});

router.get("/category-stats", requireAuth, async (req: Request, res: Response) => {
  const logs = await db
    .select({ category: exercisesTable.category })
    .from(exerciseLogsTable)
    .leftJoin(exercisesTable, eq(exerciseLogsTable.exerciseId, exercisesTable.id))
    .leftJoin(sessionsTable, eq(exerciseLogsTable.sessionId, sessionsTable.id))
    .where(eq(sessionsTable.userId, req.userId!));

  const allExercises = await db.select({ category: exercisesTable.category }).from(exercisesTable);
  const totalByCategory: Record<string, number> = {};
  for (const e of allExercises) {
    totalByCategory[e.category] = (totalByCategory[e.category] || 0) + 1;
  }

  const completedByCategory: Record<string, number> = {};
  for (const l of logs) {
    if (l.category) completedByCategory[l.category] = (completedByCategory[l.category] || 0) + 1;
  }

  const categories = [...new Set(allExercises.map(e => e.category))];
  const result = categories.map(category => {
    const completed = completedByCategory[category] || 0;
    const total = totalByCategory[category] || 1;
    const masteryPercent = Math.min(100, Math.round((completed / (total * 6)) * 100));
    return { category, exercisesCompleted: completed, masteryPercent };
  });
  res.json(result);
});

export default router;
