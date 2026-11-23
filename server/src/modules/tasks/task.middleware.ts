import type { NextFunction, Request, Response } from "express";
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamSchema,
  updateTaskSchema,
} from "./task.validation.js";

export function validateCreateTask(req: Request, res: Response, next: NextFunction) {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid task input",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  req.createTaskInput = parsed.data;
  next();
}

export function validateUpdateTask(req: Request, res: Response, next: NextFunction) {
  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid task input",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  req.updateTaskInput = parsed.data;
  next();
}

export function validateTaskListQuery(req: Request, res: Response, next: NextFunction) {
  const parsed = listTasksQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid task query",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  req.taskListQuery = parsed.data;
  next();
}

export function validateTaskId(req: Request, res: Response, next: NextFunction) {
  const parsed = taskIdParamSchema.safeParse(req.params.taskId);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid task id" });
    return;
  }
  req.taskId = parsed.data;
  next();
}
