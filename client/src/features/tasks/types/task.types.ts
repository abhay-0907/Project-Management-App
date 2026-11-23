export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export const taskPriorityValues: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export interface TaskStatus {
  id: string;
  name: string;
  slug: string;
  position: number;
  color: string;
  isDefault: boolean;
  isCompleted: boolean;
}

export interface TaskPerson {
  id: string;
  name: string;
  email?: string;
}

export interface TaskRecord {
  id: string;
  workspaceId: string;
  projectId: string;
  statusId: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  assigneeId: string | null;
  createdBy: string;
  priority: TaskPriority;
  position: number;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  status?: Pick<TaskStatus, "id" | "name" | "slug" | "color" | "isCompleted">;
  assignee?: TaskPerson | null;
}

export interface TaskDetail extends TaskRecord {
  creator: TaskPerson;
  parentTask: Pick<TaskRecord, "id" | "title" | "statusId"> | null;
  subtaskCount: number;
}

export interface TaskListResponse {
  tasks: TaskRecord[];
  statuses: TaskStatus[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface TaskListQuery {
  page: number;
  pageSize: number;
  statusId?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  sort: "position" | "createdAt" | "updatedAt" | "dueDate";
  order: "asc" | "desc";
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  statusId?: string;
  assigneeId?: string | null;
  parentTaskId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
}

export type UpdateTaskInput = Partial<
  Pick<
    TaskRecord,
    "title" | "description" | "priority" | "assigneeId" | "statusId" | "startDate" | "dueDate"
  >
>;
