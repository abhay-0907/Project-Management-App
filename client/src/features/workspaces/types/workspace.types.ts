export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  role: WorkspaceRole;
  joinedAt?: string;
}

export interface WorkspacesResponse {
  workspaces: Workspace[];
}

export interface WorkspaceResponse {
  workspace: Workspace;
  message?: string;
}

export interface CreateWorkspaceResponse extends WorkspaceResponse {
  message: string;
}

export interface WorkspaceMessageResponse {
  message: string;
}
