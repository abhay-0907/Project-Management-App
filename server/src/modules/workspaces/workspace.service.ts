import * as workspaceRepository from "./workspace.repository.js";
import type { WorkspaceRole } from "./workspace.types.js";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "./workspace.validation.js";

export class WorkspaceError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "WorkspaceError";
  }
}

export async function createWorkspaceService(input: CreateWorkspaceInput, userId: string) {
  if (await workspaceRepository.findWorkspaceBySlug(input.slug)) {
    throw new WorkspaceError(409, "A workspace with this slug already exists");
  }
  try {
    return await workspaceRepository.createWorkspace(input, userId);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new WorkspaceError(409, "A workspace with this slug already exists");
    }
    throw error;
  }
}

export function getUserWorkspacesService(userId: string) {
  return workspaceRepository.findUserWorkspaces(userId);
}

export function getWorkspaceMembersService(workspaceId: string) {
  return workspaceRepository.findWorkspaceMembers(workspaceId);
}

export async function getWorkspaceMemberService(workspaceId: string, userId: string) {
  const member = await workspaceRepository.findWorkspaceMember(workspaceId, userId);
  if (!member) throw new WorkspaceError(404, "Workspace member not found");
  return member;
}

export async function updateWorkspaceMemberRoleService(
  workspaceId: string,
  targetUserId: string,
  actorRole: WorkspaceRole,
  role: "ADMIN" | "MEMBER",
) {
  if (actorRole !== "OWNER") {
    throw new WorkspaceError(403, "Only the workspace owner can change member roles");
  }

  const target = await workspaceRepository.findWorkspaceMember(workspaceId, targetUserId);
  if (!target) throw new WorkspaceError(404, "Workspace member not found");
  if (target.role === "OWNER") {
    throw new WorkspaceError(403, "The workspace owner role cannot be changed here");
  }
  if (target.role === role) return target;

  const updated = await workspaceRepository.updateWorkspaceMemberRole(
    workspaceId,
    targetUserId,
    target.role,
    role,
  );
  if (!updated) {
    throw new WorkspaceError(409, "The member changed while you were editing. Refresh and try again");
  }
  return updated;
}

export async function removeWorkspaceMemberService(
  workspaceId: string,
  targetUserId: string,
  actorRole: WorkspaceRole,
) {
  const target = await workspaceRepository.findWorkspaceMember(workspaceId, targetUserId);
  if (!target) throw new WorkspaceError(404, "Workspace member not found");
  if (target.role === "OWNER") {
    throw new WorkspaceError(403, "The workspace owner cannot be removed");
  }
  if (actorRole !== "OWNER" && !(actorRole === "ADMIN" && target.role === "MEMBER")) {
    throw new WorkspaceError(403, "You do not have permission to remove this member");
  }

  const removed = await workspaceRepository.removeWorkspaceMember(
    workspaceId,
    targetUserId,
    target.role,
  );
  if (!removed) {
    throw new WorkspaceError(409, "The member changed while you were removing them. Refresh and try again");
  }
}

export async function getWorkspaceService(workspaceId: string) {
  const workspace = await workspaceRepository.findWorkspaceById(workspaceId);
  if (!workspace) throw new WorkspaceError(404, "Workspace not found");
  return workspace;
}

export async function updateWorkspaceService(
  workspaceId: string,
  input: UpdateWorkspaceInput,
) {
  if (input.slug) {
    const existing = await workspaceRepository.findWorkspaceBySlug(input.slug);
    if (existing && existing.id !== workspaceId) {
      throw new WorkspaceError(409, "A workspace with this slug already exists");
    }
  }
  try {
    const workspace = await workspaceRepository.updateWorkspace(workspaceId, input);
    if (!workspace) throw new WorkspaceError(404, "Workspace not found");
    return workspace;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new WorkspaceError(409, "A workspace with this slug already exists");
    }
    throw error;
  }
}

export async function deleteWorkspaceService(workspaceId: string) {
  const deleted = await workspaceRepository.deleteWorkspace(workspaceId);
  if (!deleted) throw new WorkspaceError(404, "Workspace not found");
}

function isUniqueViolation(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
