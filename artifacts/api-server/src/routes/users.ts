import { Router, Request, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    goals: user.goals,
    dailyMinutes: user.dailyMinutes,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    totalMinutes: user.totalMinutes,
    onboardingComplete: user.onboardingComplete,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/me", requireAuth, async (req: Request, res: Response) => {
  const { name, dailyMinutes, goals } = req.body;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (dailyMinutes !== undefined) updates.dailyMinutes = dailyMinutes;
  if (goals !== undefined) updates.goals = goals;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.userId!)).returning();
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    goals: user.goals,
    dailyMinutes: user.dailyMinutes,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    totalMinutes: user.totalMinutes,
    onboardingComplete: user.onboardingComplete,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/onboard", requireAuth, async (req: Request, res: Response) => {
  const { name, goals, dailyMinutes } = req.body;
  const [user] = await db
    .update(usersTable)
    .set({ name, goals, dailyMinutes, onboardingComplete: true })
    .where(eq(usersTable.id, req.userId!))
    .returning();
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    goals: user.goals,
    dailyMinutes: user.dailyMinutes,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    totalMinutes: user.totalMinutes,
    onboardingComplete: user.onboardingComplete,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
