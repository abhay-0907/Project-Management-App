import type { Request, Response } from "express";
import {
  acceptInvitation, cancelInvitation, createInvitation, InvitationError,
  listInvitations, previewInvitation, rejectInvitation, resendInvitation,
} from "./invitation.service.js";

export async function listInvitationsController(req: Request, res: Response) {
  try {
    return res.status(200).json({ invitations: await listInvitations(req.workspaceMembership!.workspaceId) });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createInvitationController(req: Request, res: Response) {
  try {
    const invitation = await createInvitation(
      req.workspaceMembership!.workspaceId,
      { id: req.auth!.user.id, name: req.auth!.user.name },
      req.workspaceMembership!.role,
      req.invitationInput!,
    );
    return res.status(201).json({ invitation, message: "Invitation sent" });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function cancelInvitationController(req: Request, res: Response) {
  try {
    await cancelInvitation(req.workspaceMembership!.workspaceId, req.invitationId!, req.workspaceMembership!.role, {
      id: req.auth!.user.id,
      name: req.auth!.user.name,
    });
    return res.status(200).json({ message: "Invitation cancelled" });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resendInvitationController(req: Request, res: Response) {
  try {
    const result = await resendInvitation(
      req.workspaceMembership!.workspaceId,
      req.invitationId!,
      { id: req.auth!.user.id, name: req.auth!.user.name },
      req.workspaceMembership!.role,
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function previewInvitationController(req: Request, res: Response) {
  try {
    return res.status(200).json({ invitation: await previewInvitation(req.invitationToken!) });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function acceptInvitationController(req: Request, res: Response) {
  try {
    const result = await acceptInvitation(req.invitationAcceptInput!.token, {
      id: req.auth!.user.id,
      email: req.auth!.user.email,
      name: req.auth!.user.name,
      emailVerifiedAt: req.auth!.user.emailVerifiedAt,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function rejectInvitationController(req: Request, res: Response) {
  try {
    const result = await rejectInvitation(req.invitationRejectInput!.token, {
      id: req.auth!.user.id,
      name: req.auth!.user.name,
      email: req.auth!.user.email,
      emailVerifiedAt: req.auth!.user.emailVerifiedAt,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

function handleError(res: Response, error: unknown) {
  if (error instanceof InvitationError) return res.status(error.status).json({ error: error.message });
  // Never log submitted invitation tokens or request payloads.
  console.error("Invitation request failed");
  return res.status(500).json({ error: "Invitation request failed" });
}
