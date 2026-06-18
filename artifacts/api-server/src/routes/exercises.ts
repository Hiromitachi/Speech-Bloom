import { Router, Request, Response } from "express";
import { db, exercisesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const { category } = req.query as { category?: string };
  let exercises;
  if (category) {
    exercises = await db.select().from(exercisesTable).where(eq(exercisesTable.category, category)).orderBy(asc(exercisesTable.sortOrder));
  } else {
    exercises = await db.select().from(exercisesTable).orderBy(asc(exercisesTable.sortOrder));
  }
  res.json(exercises);
});

router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  const [exercise] = await db.select().from(exercisesTable).where(eq(exercisesTable.id, id)).limit(1);
  if (!exercise) {
    res.status(404).json({ error: "Exercise not found" });
    return;
  }
  res.json(exercise);
});

export default router;
