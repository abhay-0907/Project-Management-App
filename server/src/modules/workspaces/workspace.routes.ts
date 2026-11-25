import { Router, type ErrorRequestHandler } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  createWorkspaceController,
  deleteWorkspaceController,
  updateWorkspaceController,
  userWorkspacesController,
  workspaceDetailsController,
} from "./workspace.controller.js";
import {
  requireWorkspaceMembership,
  requireWorkspaceRole,
  validateCreateWorkspace,
  validateUpdateWorkspace,
} from "./workspace.middleware.js";
import projectRouter from "../projects/project.routes.js";
import workspaceMemberRouter from "../workspace-members/member.routes.js";
import { workspaceInvitationRouter } from "../invitations/invitation.routes.js";
import activityRouter from "../activity-logs/activity.routes.js";
import { requireTaskInWorkspace, validateTaskId } from "../tasks/task.middleware.js";

const router = Router();

router.use(requireAuth);
router.use("/:workspaceId/projects", requireWorkspaceMembership, projectRouter);
// Authentication is inherited from this router; member routes verify membership per operation.
router.use("/:workspaceId/members", workspaceMemberRouter);
router.use("/:workspaceId/invitations", workspaceInvitationRouter);
router.use("/:workspaceId/activities", requireWorkspaceMembership, activityRouter);
router.use(
  "/:workspaceId/tasks/:taskId/activities",
  requireWorkspaceMembership,
  validateTaskId,
  requireTaskInWorkspace,
  activityRouter,
);
router.post("/", validateCreateWorkspace, createWorkspaceController);
router.get("/", userWorkspacesController);
router.get(
  "/:workspaceId",
  requireWorkspaceMembership,
  workspaceDetailsController,
);
router.patch(
  "/:workspaceId",
  requireWorkspaceMembership,
  requireWorkspaceRole("OWNER", "ADMIN"),
  validateUpdateWorkspace,
  updateWorkspaceController,
);
router.delete(
  "/:workspaceId",
  requireWorkspaceMembership,
  requireWorkspaceRole("OWNER"),
  deleteWorkspaceController,
);

const workspaceErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("Workspace request failed");
  return res.status(500).json({ error: "Workspace request failed" });
};

router.use(workspaceErrorHandler);

export default router;
