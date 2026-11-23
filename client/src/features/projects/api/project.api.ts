export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";

export interface ProjectRecord {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdBy: string;
  creator?: { id: string; name: string };
  startDate: string | null;
  dueDate: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  startDate?: string | null;
  dueDate?: string | null;
}

export interface ProjectListQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: ProjectStatus;
  sort: "updated" | "newest" | "name";
}

export interface ProjectListResponse {
  projects: ProjectRecord[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  summary: {
    total: number;
    active: number;
    onHold: number;
    completed: number;
    archived: number;
  };
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export class ProjectApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "ProjectApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch {
    throw new ProjectApiError(
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
    throw new ProjectApiError(
      body?.error ?? "The project request failed. Please try again.",
      response.status,
      body?.details,
    );
  }
  return payload as T;
}

function workspaceProjectsPath(workspaceId: string) {
  return `/workspaces/${encodeURIComponent(workspaceId)}/projects`;
}

export const projectApi = {
  list(workspaceId: string, query: ProjectListQuery) {
    const searchParams = new URLSearchParams({
      page: String(query.page),
      pageSize: String(query.pageSize),
      sort: query.sort,
    });
    if (query.search) searchParams.set("search", query.search);
    if (query.status) searchParams.set("status", query.status);
    return request<ProjectListResponse>(
      `${workspaceProjectsPath(workspaceId)}?${searchParams.toString()}`,
    );
  },

  get(workspaceId: string, projectId: string) {
    return request<{ project: ProjectRecord }>(
      `${workspaceProjectsPath(workspaceId)}/${encodeURIComponent(projectId)}`,
    ).then(({ project }) => project);
  },

  create(workspaceId: string, input: ProjectInput) {
    return request<{ project: ProjectRecord; message: string }>(workspaceProjectsPath(workspaceId), {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(workspaceId: string, projectId: string, input: Partial<ProjectInput>) {
    return request<{ project: ProjectRecord; message: string }>(
      `${workspaceProjectsPath(workspaceId)}/${encodeURIComponent(projectId)}`,
      { method: "PATCH", body: JSON.stringify(input) },
    );
  },

  delete(workspaceId: string, projectId: string) {
    return request<{ message: string }>(
      `${workspaceProjectsPath(workspaceId)}/${encodeURIComponent(projectId)}`,
      { method: "DELETE" },
    );
  },
};
