import { Router } from "express";
import { requireWorkspaceMembership, requireWorkspaceRole } from "../workspaces/workspace.middleware.js";
import {
  getWorkspaceMemberController,
  listWorkspaceMembersController,
  removeWorkspaceMemberController,
  updateWorkspaceMemberRoleController,
} from "./member.controller.js";
import { validateMemberId, validateUpdateMemberRole } from "./member.validation.js";
import "./member.types.js";

const router = Router({ mergeParams: true });

router.get("/", requireWorkspaceMembership, listWorkspaceMembersController);
router.get("/:memberId", requireWorkspaceMembership, validateMemberId, getWorkspaceMemberController);
router.patch(
  "/:memberId/role",
  requireWorkspaceMembership,
  requireWorkspaceRole("OWNER"),
  validateMemberId,
  validateUpdateMemberRole,
  updateWorkspaceMemberRoleController,
);
router.delete(
  "/:memberId",
  requireWorkspaceMembership,
  requireWorkspaceRole("OWNER", "ADMIN"),
  validateMemberId,
  removeWorkspaceMemberController,
);

export default router;
