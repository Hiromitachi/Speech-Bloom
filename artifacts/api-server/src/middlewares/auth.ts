import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.signedCookies?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const id = parseInt(userId, 10);
  if (isNaN(id)) {
    res.status(401).json({ error: "Invalid session" });
    return;
  }
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  req.userId = id;
  next();
}
