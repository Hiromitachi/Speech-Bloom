import { Router, Request, Response } from "express";
import { db, achievementsTable, userAchievementsTable, sessionsTable, exerciseLogsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function checkAndAwardAchievements(userId: number) {
  const allAchievements = await db.select().from(achievementsTable);
  const earned = await db.select().from(userAchievementsTable).where(eq(userAchievementsTable.userId, userId));
  const earnedIds = new Set(earned.map(e => e.achievementId));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const sessions = await db.select().from(sessionsTable).where(eq(sessionsTable.userId, userId));
  const logs = await db.select().from(exerciseLogsTable)
    .leftJoin(sessionsTable, eq(exerciseLogsTable.sessionId, sessionsTable.id))
    .where(eq(sessionsTable.userId, userId));

  for (const ach of allAchievements) {
    if (earnedIds.has(ach.id)) continue;
    let earned = false;
    if (ach.conditionType === "streak" && user && user.currentStreak >= ach.conditionValue) earned = true;
    if (ach.conditionType === "sessions" && sessions.length >= ach.conditionValue) earned = true;
    if (ach.conditionType === "exercises" && logs.length >= ach.conditionValue) earned = true;
    if (ach.conditionType === "minutes" && user && user.totalMinutes >= ach.conditionValue) earned = true;
    if (earned) {
      await db.insert(userAchievementsTable).values({ userId, achievementId: ach.id }).onConflictDoNothing();
    }
  }
}

router.get("/", requireAuth, async (req: Request, res: Response) => {
  await checkAndAwardAchievements(req.userId!);
  const allAchievements = await db.select().from(achievementsTable);
  const earned = await db.select().from(userAchievementsTable).where(eq(userAchievementsTable.userId, req.userId!));
  const earnedMap = new Map(earned.map(e => [e.achievementId, e.earnedAt]));
  res.json(allAchievements.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    earned: earnedMap.has(a.id),
    earnedAt: earnedMap.get(a.id)?.toISOString() || null,
  })));
});

export default router;
