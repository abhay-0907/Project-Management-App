import { Router } from "express";
import { requireWorkspaceRole } from "../workspaces/workspace.middleware.js";
import {
  createProjectController,
  deleteProjectController,
  listProjectsController,
  projectDetailsController,
  updateProjectController,
} from "./project.controller.js";
import taskRouter from "../tasks/task.routes.js";
import boardRouter from "../tasks/board.routes.js";
import {
  requireProjectInWorkspace,
  validateCreateProject,
  validateProjectId,
  validateProjectListQuery,
  validateUpdateProject,
} from "./project.middleware.js";

const router = Router({ mergeParams: true });

router.use(
  "/:projectId/tasks",
  validateProjectId,
  requireProjectInWorkspace,
  taskRouter,
);
router.use(
  "/:projectId/board",
  validateProjectId,
  requireProjectInWorkspace,
  boardRouter,
);
router.get("/", validateProjectListQuery, listProjectsController);
router.post("/", validateCreateProject, createProjectController);
router.get(
  "/:projectId",
  validateProjectId,
  requireProjectInWorkspace,
  projectDetailsController,
);
router.patch(
  "/:projectId",
  validateProjectId,
  validateUpdateProject,
  updateProjectController,
);
router.delete(
  "/:projectId",
  validateProjectId,
  requireProjectInWorkspace,
  requireWorkspaceRole("OWNER", "ADMIN"),
  deleteProjectController,
);

export default router;
