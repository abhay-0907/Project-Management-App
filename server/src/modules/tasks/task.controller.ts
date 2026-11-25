import type { Request, Response } from "express";
import {
  createTaskService,
  deleteTaskService,
  getTaskDetailsService,
  isTaskServiceError,
  listTasksService,
  updateTaskService,
} from "./task.service.js";

export async function createTaskController(req: Request, res: Response) {
  try {
    const task = await createTaskService(
      req.workspaceMembership!.workspaceId,
      req.projectId!,
      { id: req.auth!.user.id, name: req.auth!.user.name },
      req.createTaskInput!,
    );
    return res.status(201).json({ task, message: "Task created successfully" });
  } catch (error) {
    return handleError(res, error, "Task creation failed");
  }
}

export async function listTasksController(req: Request, res: Response) {
  try {
    const result = await listTasksService(
      req.workspaceMembership!.workspaceId,
      req.projectId!,
      req.taskListQuery!,
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, "Task listing failed");
  }
}

export async function taskDetailsController(req: Request, res: Response) {
  try {
    const task = await getTaskDetailsService(
      req.workspaceMembership!.workspaceId,
      req.projectId!,
      req.taskId!,
    );
    return res.status(200).json({ task });
  } catch (error) {
    return handleError(res, error, "Task lookup failed");
  }
}

export async function updateTaskController(req: Request, res: Response) {
  try {
    const task = await updateTaskService(
      req.workspaceMembership!.workspaceId,
      req.projectId!,
      req.taskId!,
      req.updateTaskInput!,
      { id: req.auth!.user.id, name: req.auth!.user.name },
    );
    return res.status(200).json({ task, message: "Task updated successfully" });
  } catch (error) {
    return handleError(res, error, "Task update failed");
  }
}

export async function deleteTaskController(req: Request, res: Response) {
  try {
    await deleteTaskService(
      req.workspaceMembership!.workspaceId,
      req.projectId!,
      req.taskId!,
      { id: req.auth!.user.id, name: req.auth!.user.name },
    );
    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    return handleError(res, error, "Task deletion failed");
  }
}

function handleError(res: Response, error: unknown, fallback: string) {
  if (isTaskServiceError(error)) return res.status(error.status).json({ error: error.message });
  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
}
