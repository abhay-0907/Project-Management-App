import { Router } from "express";
import { requireWorkspaceRole } from "../workspaces/workspace.middleware.js";
import {
  createTaskController,
  deleteTaskController,
  listTasksController,
  taskDetailsController,
  updateTaskController,
} from "./task.controller.js";
import {
  validateCreateTask,
  validateTaskId,
  validateTaskListQuery,
  validateUpdateTask,
} from "./task.middleware.js";

const router = Router({ mergeParams: true });

router.get("/", validateTaskListQuery, listTasksController);
router.post("/", validateCreateTask, createTaskController);
router.get("/:taskId", validateTaskId, taskDetailsController);
router.patch("/:taskId", validateTaskId, validateUpdateTask, updateTaskController);
router.delete(
  "/:taskId",
  validateTaskId,
  requireWorkspaceRole("OWNER", "ADMIN"),
  deleteTaskController,
);

export default router;
