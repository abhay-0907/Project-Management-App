import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  createWorkspaceController,
  deleteWorkspaceController,
  getWorkspaceMemberController,
  removeWorkspaceMemberController,
  workspaceMembersController,
  updateWorkspaceMemberRoleController,
  updateWorkspaceController,
  userWorkspacesController,
  workspaceDetailsController,
} from "./workspace.controller.js";
import {
  requireWorkspaceMembership,
  requireWorkspaceRole,
  validateCreateWorkspace,
  validateUpdateWorkspaceMemberRole,
  validateUpdateWorkspace,
  validateWorkspaceMemberId,
} from "./workspace.middleware.js";
import projectRouter from "../projects/project.routes.js";

const router = Router();

router.use(requireAuth);
router.use("/:workspaceId/projects", requireWorkspaceMembership, projectRouter);
router.post("/", validateCreateWorkspace, createWorkspaceController);
router.get("/", userWorkspacesController);
router.get("/:workspaceId/members", requireWorkspaceMembership, workspaceMembersController);
router.get(
  "/:workspaceId/members/:memberId",
  requireWorkspaceMembership,
  validateWorkspaceMemberId,
  getWorkspaceMemberController,
);
router.patch(
  "/:workspaceId/members/:memberId/role",
  requireWorkspaceMembership,
  requireWorkspaceRole("OWNER"),
  validateWorkspaceMemberId,
  validateUpdateWorkspaceMemberRole,
  updateWorkspaceMemberRoleController,
);
router.delete(
  "/:workspaceId/members/:memberId",
  requireWorkspaceMembership,
  requireWorkspaceRole("OWNER", "ADMIN"),
  validateWorkspaceMemberId,
  removeWorkspaceMemberController,
);
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

export default router;
