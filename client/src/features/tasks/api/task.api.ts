import type {
  CreateTaskInput,
  TaskDetail,
  TaskListQuery,
  TaskListResponse,
  TaskRecord,
  UpdateTaskInput,
} from "../types/task.types";
import type {
  CreateBoardColumnInput,
  DeleteBoardColumnInput,
  DeleteBoardColumnResponse,
  ProjectBoardData,
  UpdateBoardColumnInput,
} from "@/features/projects/types/project-board.types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export class TaskApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "TaskApiError";
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
    throw new TaskApiError("Could not reach the server. Check that the API is running and try again.", 0);
  }

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json")
    ? await response.json().catch(() => null)
    : null;
  if (!response.ok) {
    const body = payload as { error?: string; details?: Record<string, string[] | undefined> } | null;
    throw new TaskApiError(body?.error ?? "The task request failed. Please try again.", response.status, body?.details);
  }
  return payload as T;
}

function projectTasksPath(workspaceId: string, projectId: string) {
  return `/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/tasks`;
}

function projectBoardPath(workspaceId: string, projectId: string) {
  return `/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/board`;
}

export const taskApi = {
  board(workspaceId: string, projectId: string) {
    return request<{ board: ProjectBoardData }>(projectBoardPath(workspaceId, projectId))
      .then(({ board }) => board);
  },

  createBoardColumn(workspaceId: string, projectId: string, input: CreateBoardColumnInput) {
    return request<{ column: ProjectBoardData["columns"][number]; message: string }>(
      `${projectBoardPath(workspaceId, projectId)}/columns`,
      { method: "POST", body: JSON.stringify(input) },
    );
  },

  updateBoardColumn(
    workspaceId: string,
    projectId: string,
    statusId: string,
    input: UpdateBoardColumnInput,
  ) {
    return request<{ column: ProjectBoardData["columns"][number]; message: string }>(
      `${projectBoardPath(workspaceId, projectId)}/columns/${encodeURIComponent(statusId)}`,
      { method: "PATCH", body: JSON.stringify(input) },
    );
  },

  deleteBoardColumn(
    workspaceId: string,
    projectId: string,
    statusId: string,
    input: DeleteBoardColumnInput,
  ) {
    return request<DeleteBoardColumnResponse>(
      `${projectBoardPath(workspaceId, projectId)}/columns/${encodeURIComponent(statusId)}`,
      { method: "DELETE", body: JSON.stringify(input) },
    );
  },

  list(workspaceId: string, projectId: string, query: TaskListQuery) {
    const search = new URLSearchParams({
      page: String(query.page),
      pageSize: String(query.pageSize),
      sort: query.sort,
      order: query.order,
    });
    if (query.statusId) search.set("statusId", query.statusId);
    if (query.priority) search.set("priority", query.priority);
    if (query.assigneeId) search.set("assigneeId", query.assigneeId);
    return request<TaskListResponse>(`${projectTasksPath(workspaceId, projectId)}?${search.toString()}`);
  },

  get(workspaceId: string, projectId: string, taskId: string) {
    return request<{ task: TaskDetail }>(
      `${projectTasksPath(workspaceId, projectId)}/${encodeURIComponent(taskId)}`,
    ).then(({ task }) => task);
  },

  create(workspaceId: string, projectId: string, input: CreateTaskInput) {
    return request<{ task: TaskRecord; message: string }>(projectTasksPath(workspaceId, projectId), {
      method: "POST",
      body: JSON.stringify(input),
    }).then(({ task }) => task);
  },

  update(workspaceId: string, projectId: string, taskId: string, input: UpdateTaskInput) {
    return request<{ task: TaskRecord; message: string }>(
      `${projectTasksPath(workspaceId, projectId)}/${encodeURIComponent(taskId)}`,
      { method: "PATCH", body: JSON.stringify(input) },
    ).then(({ task }) => task);
  },

  delete(workspaceId: string, projectId: string, taskId: string) {
    return request<{ message: string }>(
      `${projectTasksPath(workspaceId, projectId)}/${encodeURIComponent(taskId)}`,
      { method: "DELETE" },
    );
  },
};
