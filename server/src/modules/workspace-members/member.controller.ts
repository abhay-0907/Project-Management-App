import type { Request, Response } from "express";
import {
  changeWorkspaceMemberRole,
  getWorkspaceMember,
  listWorkspaceMembers,
  MemberError,
  removeWorkspaceMember,
} from "./member.service.js";
import "./member.types.js";

export async function listWorkspaceMembersController(req: Request, res: Response) {
  try {
    const members = await listWorkspaceMembers(req.workspaceMembership!.workspaceId);
    return res.status(200).json({ members });
  } catch (error) {
    return handleMemberError(res, error);
  }
}

export async function getWorkspaceMemberController(req: Request, res: Response) {
  try {
    const member = await getWorkspaceMember(
      req.workspaceMembership!.workspaceId,
      req.memberId!,
    );
    return res.status(200).json({ member });
  } catch (error) {
    return handleMemberError(res, error);
  }
}

export async function updateWorkspaceMemberRoleController(req: Request, res: Response) {
  try {
    const member = await changeWorkspaceMemberRole(
      req.workspaceMembership!.workspaceId,
      req.memberId!,
      req.workspaceMembership!.role,
      req.updateMemberRoleInput!.role,
      { id: req.auth!.user.id, name: req.auth!.user.name },
    );
    return res.status(200).json({ member, message: "Workspace member role updated" });
  } catch (error) {
    return handleMemberError(res, error);
  }
}

export async function removeWorkspaceMemberController(req: Request, res: Response) {
  try {
    await removeWorkspaceMember(
      req.workspaceMembership!.workspaceId,
      req.memberId!,
      req.workspaceMembership!.role,
      { id: req.auth!.user.id, name: req.auth!.user.name },
    );
    return res.status(200).json({ message: "Workspace member removed" });
  } catch (error) {
    return handleMemberError(res, error);
  }
}

function handleMemberError(res: Response, error: unknown) {
  if (error instanceof MemberError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("Workspace member request failed", error);
  return res.status(500).json({ error: "Workspace member request failed" });
}
