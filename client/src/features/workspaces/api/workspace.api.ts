import type {
  CreateWorkspaceResponse,
  WorkspaceMessageResponse,
  AssignableWorkspaceRole,
  WorkspaceResponse,
  WorkspacesResponse,
  WorkspaceMemberRecord,
} from "../types/workspace.types";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "../schemas/workspace.schema";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export class WorkspaceApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "WorkspaceApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch {
    throw new WorkspaceApiError(
      "Could not reach the server. Check that the API is running and try again.",
      0,
    );
  }

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const body = payload as {
      error?: string;
      details?: Record<string, string[] | undefined>;
    } | null;
    throw new WorkspaceApiError(
      body?.error ?? "The workspace request failed. Please try again.",
      response.status,
      body?.details,
    );
  }

  return payload as T;
}

export const workspaceApi = {
  list() {
    return request<WorkspacesResponse>("/workspaces").then(({ workspaces }) => workspaces);
  },

  get(workspaceId: string) {
    return request<WorkspaceResponse>(`/workspaces/${encodeURIComponent(workspaceId)}`)
      .then(({ workspace }) => workspace);
  },

  members(workspaceId: string) {
    return request<{ members: WorkspaceMemberRecord[] }>(
      `/workspaces/${encodeURIComponent(workspaceId)}/members`,
    ).then(({ members }) => members);
  },

  member(workspaceId: string, memberId: string) {
    return request<{ member: WorkspaceMemberRecord }>(
      `/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(memberId)}`,
    ).then(({ member }) => member);
  },

  updateMemberRole(workspaceId: string, memberId: string, role: AssignableWorkspaceRole) {
    return request<{ member: WorkspaceMemberRecord; message: string }>(
      `/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(memberId)}/role`,
      { method: "PATCH", body: JSON.stringify({ role }) },
    );
  },

  removeMember(workspaceId: string, memberId: string) {
    return request<WorkspaceMessageResponse>(
      `/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(memberId)}`,
      { method: "DELETE" },
    );
  },

  create(input: CreateWorkspaceInput) {
    return request<CreateWorkspaceResponse>("/workspaces", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(workspaceId: string, input: UpdateWorkspaceInput) {
    return request<WorkspaceResponse>(`/workspaces/${encodeURIComponent(workspaceId)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  delete(workspaceId: string) {
    return request<WorkspaceMessageResponse>(`/workspaces/${encodeURIComponent(workspaceId)}`, {
      method: "DELETE",
    });
  },
};
