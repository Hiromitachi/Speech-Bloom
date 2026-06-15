import { Router, Request, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const COOKIE_OPTIONS = {
  signed: true,
  httpOnly: true,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

router.post("/login", async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (!user) {
    const [newUser] = await db
      .insert(usersTable)
      .values({ email, name: name || email.split("@")[0], role: "patient" })
      .returning();
    user = newUser;
    req.log.info({ userId: user.id }, "New user created");
  } else {
    req.log.info({ userId: user.id }, "User logged in");
  }

  res.cookie("userId", String(user.id), COOKIE_OPTIONS);
  res.json({ user });
});

router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("userId");
  res.json({ success: true });
});

router.get("/session", async (req: Request, res: Response) => {
  const userId = req.signedCookies?.userId;
  if (!userId) {
    res.json({ user: null });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parseInt(userId))).limit(1);
  res.json({ user: user || null });
});

export default router;
