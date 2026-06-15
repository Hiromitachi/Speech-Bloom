import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import exercisesRouter from "./exercises";
import sessionsRouter from "./sessions";
import progressRouter from "./progress";
import achievementsRouter from "./achievements";
import patientsRouter from "./patients";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/exercises", exercisesRouter);
router.use("/sessions", sessionsRouter);
router.use("/progress", progressRouter);
router.use("/achievements", achievementsRouter);
router.use("/patients", patientsRouter);

export default router;
