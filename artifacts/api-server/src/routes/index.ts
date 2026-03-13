import { Router, type IRouter } from "express";
import healthRouter from "./health";
import glucoseRouter from "./glucose";

const router: IRouter = Router();

router.use(healthRouter);
router.use(glucoseRouter);

export default router;
