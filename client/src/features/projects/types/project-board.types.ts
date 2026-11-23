import type { ProjectRecord } from "../api/project.api";
import type { TaskRecord, TaskStatus } from "@/features/tasks/types/task.types";

export interface ProjectBoardColumn extends TaskStatus {
  tasks: TaskRecord[];
}

export interface ProjectBoardData {
  project: ProjectRecord;
  columns: ProjectBoardColumn[];
  totalTasks: number;
}

export interface CreateBoardColumnInput {
  name: string;
  color?: string;
  isDefault?: boolean;
  isCompleted?: boolean;
}

export interface UpdateBoardColumnInput {
  name?: string;
  color?: string | null;
  position?: number;
  isDefault?: boolean;
  isCompleted?: boolean;
}

export interface DeleteBoardColumnInput {
  reassignToStatusId?: string;
}

export interface DeleteBoardColumnResponse {
  deletedStatusId: string;
  reassignedTaskCount: number;
  reassignedToStatusId: string | null;
  message: string;
}
