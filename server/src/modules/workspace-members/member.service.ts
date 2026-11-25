import * as memberRepository from "./member.repository.js";
import type { WorkspaceRole } from "../workspaces/workspace.types.js";
import type { EditableWorkspaceMemberRole } from "./member.types.js";
import type { ActivityActor } from "../activity-logs/activity.types.js";

export class MemberError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "MemberError";
  }
}

export function listWorkspaceMembers(workspaceId: string) {
  return memberRepository.findWorkspaceMembers(workspaceId);
}

export async function getWorkspaceMember(workspaceId: string, userId: string) {
  const member = await memberRepository.findWorkspaceMember(workspaceId, userId);
  if (!member) throw new MemberError(404, "Workspace member not found");
  return member;
}

export async function changeWorkspaceMemberRole(
  workspaceId: string,
  targetUserId: string,
  actorRole: WorkspaceRole,
  role: EditableWorkspaceMemberRole,
  actor: ActivityActor,
) {
  if (actorRole !== "OWNER") {
    throw new MemberError(403, "Only the workspace owner can change member roles");
  }

  const target = await memberRepository.findWorkspaceMember(workspaceId, targetUserId);
  if (!target) throw new MemberError(404, "Workspace member not found");
  if (target.role === "OWNER") {
    throw new MemberError(403, "The workspace owner role cannot be changed here");
  }
  if (target.role === role) return target;

  const updated = await memberRepository.updateWorkspaceMemberRole(
    workspaceId,
    targetUserId,
    target.role,
    role,
    actor,
  );
  if (!updated) {
    throw new MemberError(409, "The member changed while you were editing. Refresh and try again");
  }
  return updated;
}

export async function removeWorkspaceMember(
  workspaceId: string,
  targetUserId: string,
  actorRole: WorkspaceRole,
  actor: ActivityActor,
) {
  const target = await memberRepository.findWorkspaceMember(workspaceId, targetUserId);
  if (!target) throw new MemberError(404, "Workspace member not found");
  if (target.role === "OWNER") {
    throw new MemberError(403, "The workspace owner cannot be removed");
  }
  if (actorRole !== "OWNER" && !(actorRole === "ADMIN" && target.role === "MEMBER")) {
    throw new MemberError(403, "You do not have permission to remove this member");
  }

  const removed = await memberRepository.removeWorkspaceMember(
    workspaceId,
    targetUserId,
    target.role,
    actor,
  );
  if (!removed) {
    throw new MemberError(409, "The member changed while you were removing them. Refresh and try again");
  }
}
