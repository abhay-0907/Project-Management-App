export type ActivityAction =
  | "WORKSPACE_CREATED" | "WORKSPACE_UPDATED" | "WORKSPACE_DELETED"
  | "MEMBER_ADDED" | "MEMBER_ROLE_CHANGED" | "MEMBER_REMOVED"
  | "INVITATION_CREATED" | "INVITATION_SENT" | "INVITATION_RESENT"
  | "INVITATION_ACCEPTED" | "INVITATION_REJECTED" | "INVITATION_CANCELLED"
  | "PROJECT_CREATED" | "PROJECT_UPDATED" | "PROJECT_DELETED"
  | "TASK_CREATED" | "TASK_UPDATED" | "TASK_STATUS_CHANGED"
  | "TASK_PRIORITY_CHANGED" | "TASK_ASSIGNEE_CHANGED" | "TASK_DUE_DATE_CHANGED"
  | "TASK_DELETED" | "BOARD_COLUMN_CREATED" | "BOARD_COLUMN_RENAMED"
  | "BOARD_COLUMN_REORDERED" | "BOARD_COLUMN_UPDATED" | "BOARD_COLUMN_DELETED";

export type ActivityEntityType = "WORKSPACE" | "MEMBER" | "INVITATION" | "PROJECT" | "TASK" | "BOARD_COLUMN";

export type ActivityRecord = {
  id: string;
  workspaceId: string | null;
  workspaceName: string | null;
  actorId: string | null;
  actorName: string | null;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityName: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ActivityFilter = {
  page?: number;
  pageSize?: number;
  action?: ActivityAction;
  actorId?: string;
  entityType?: ActivityEntityType;
  from?: string;
  to?: string;
  projectId?: string;
  taskId?: string;
};

export type ActivityListResponse = {
  activities: ActivityRecord[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export class ActivityApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ActivityApiError";
  }
}

async function request(path: string): Promise<ActivityListResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { credentials: "include" });
  } catch {
    throw new ActivityApiError("Could not reach the server. Check that the API is running and try again.", 0);
  }
  const payload = await response.json().catch(() => null) as (ActivityListResponse & { error?: string }) | null;
  if (!response.ok) throw new ActivityApiError(payload?.error ?? "Activity could not be loaded.", response.status);
  return payload as ActivityListResponse;
}

export const activityApi = {
  list(workspaceId: string, filter: ActivityFilter = {}) {
    const { projectId, taskId, ...query } = filter;
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) search.set(key, String(value));
    }
    const base = `/workspaces/${encodeURIComponent(workspaceId)}`;
    const path = taskId
      ? `${base}/tasks/${encodeURIComponent(taskId)}/activities`
      : projectId
        ? `${base}/projects/${encodeURIComponent(projectId)}/activities`
        : `${base}/activities`;
    const encodedQuery = search.toString();
    const suffix = encodedQuery ? `?${encodedQuery}` : "";
    return request(`${path}${suffix}`);
  },
};
