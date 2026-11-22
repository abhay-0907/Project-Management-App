import * as workspaceRepository from "./workspace.repository.js";
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
