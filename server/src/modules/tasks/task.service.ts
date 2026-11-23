import type { Task } from "../../db/schema/tasks.schema.js";
import * as taskRepository from "./task.repository.js";
import { isTaskError, TaskError } from "./task.errors.js";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "./task.validation.js";

export async function createTaskService(
  workspaceId: string,
  projectId: string,
  userId: string,
  input: CreateTaskInput,
) {
  try {
    const task = await taskRepository.createTask(workspaceId, projectId, userId, input);
    if (!task) throw new TaskError(404, "Project not found");
    return task;
  } catch (error) {
    throw mapTaskPersistenceError(error);
  }
}

export async function listTasksService(
  workspaceId: string,
  projectId: string,
  query: ListTasksQuery,
) {
  if (
    query.statusId &&
    !(await taskRepository.findProjectStatus(workspaceId, projectId, query.statusId))
  ) {
    throw new TaskError(400, "Status must belong to this project");
  }
  return taskRepository.listProjectTasks(workspaceId, projectId, query);
}

export async function getTaskDetailsService(
  workspaceId: string,
  projectId: string,
  taskId: string,
) {
  const task = await taskRepository.findTaskWithDetails(workspaceId, projectId, taskId);
  if (!task) throw new TaskError(404, "Task not found");
  return task;
}

export async function updateTaskService(
  workspaceId: string,
  projectId: string,
  taskId: string,
  input: UpdateTaskInput,
) {
  try {
    const task: Task | null = await taskRepository.updateTask(
      workspaceId,
      projectId,
      taskId,
      input,
    );
    if (!task) throw new TaskError(404, "Task not found");
    return task;
  } catch (error) {
    throw mapTaskPersistenceError(error);
  }
}

export async function deleteTaskService(
  workspaceId: string,
  projectId: string,
  taskId: string,
) {
  try {
    const deleted = await taskRepository.deleteTask(workspaceId, projectId, taskId);
    if (!deleted) throw new TaskError(404, "Task not found");
  } catch (error) {
    if (hasPostgresCode(error, "23503")) {
      throw new TaskError(409, "Delete subtasks before deleting this task");
    }
    throw mapTaskPersistenceError(error);
  }
}

export function isTaskServiceError(error: unknown): error is TaskError {
  return isTaskError(error);
}

function mapTaskPersistenceError(error: unknown): Error {
  if (isTaskError(error)) return error;

  if (hasPostgresCode(error, "23514")) {
    return new TaskError(400, "Due date cannot be earlier than the start date");
  }
  if (hasPostgresCode(error, "23503")) {
    return new TaskError(400, "Assignee, parent task, or status is not valid for this project");
  }
  if (hasPostgresCode(error, "23502")) {
    return new TaskError(400, "A required task field is missing");
  }
  if (hasPostgresCode(error, "23505")) {
    return new TaskError(409, "Task could not be saved because of a conflicting record");
  }
  return error instanceof Error ? error : new Error("Task operation failed");
}

function hasPostgresCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}
