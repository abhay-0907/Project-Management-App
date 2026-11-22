import { Router } from "express";
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

const router = Router();

router.use(requireAuth);
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

export default router;
