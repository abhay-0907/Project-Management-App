import { Router } from "express";
import { listActivitiesController, validateActivityQueryController } from "./activity.controller.js";

const router = Router({ mergeParams: true });
router.get("/", validateActivityQueryController, listActivitiesController);

export default router;
