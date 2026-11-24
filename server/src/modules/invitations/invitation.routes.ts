import { Router, type ErrorRequestHandler } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireWorkspaceMembership, requireWorkspaceRole } from "../workspaces/workspace.middleware.js";
import {
  acceptInvitationController, cancelInvitationController, createInvitationController,
  listInvitationsController, previewInvitationController, rejectInvitationController,
  resendInvitationController,
} from "./invitation.controller.js";
import {
  validateCreateInvitation, validateInvitationId, validateInvitationToken,
  validateInvitationTokenBody,
} from "./invitation.validation.js";
import "./invitation.types.js";

const invitationMiddlewareErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("Invitation middleware request failed");
  return res.status(500).json({ error: "Invitation request failed" });
};

export const workspaceInvitationRouter = Router({ mergeParams: true });
workspaceInvitationRouter.get(
  "/", requireWorkspaceMembership, requireWorkspaceRole("OWNER", "ADMIN"), listInvitationsController,
);
workspaceInvitationRouter.post(
  "/", requireWorkspaceMembership, requireWorkspaceRole("OWNER", "ADMIN"),
  validateCreateInvitation, createInvitationController,
);
workspaceInvitationRouter.delete(
  "/:invitationId", requireWorkspaceMembership, requireWorkspaceRole("OWNER", "ADMIN"),
  validateInvitationId, cancelInvitationController,
);
workspaceInvitationRouter.post(
  "/:invitationId/resend", requireWorkspaceMembership, requireWorkspaceRole("OWNER", "ADMIN"),
  validateInvitationId, resendInvitationController,
);
workspaceInvitationRouter.use(invitationMiddlewareErrorHandler);

const invitationRouter = Router();
invitationRouter.get("/:token", validateInvitationToken, previewInvitationController);
invitationRouter.post("/accept", requireAuth, validateInvitationTokenBody, acceptInvitationController);
invitationRouter.post("/reject", requireAuth, validateInvitationTokenBody, rejectInvitationController);
invitationRouter.use(invitationMiddlewareErrorHandler);

export default invitationRouter;
