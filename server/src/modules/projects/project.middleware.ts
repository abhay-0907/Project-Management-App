import type { NextFunction, Request, Response } from "express";
import { findProjectInWorkspace } from "./project.repository.js";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  projectIdSchema,
  updateProjectSchema,
} from "./project.validation.js";

export function validateCreateProject(req: Request, res: Response, next: NextFunction) {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid project input",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  req.createProjectInput = parsed.data;
  next();
}

export function validateUpdateProject(req: Request, res: Response, next: NextFunction) {
  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid project input",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  req.updateProjectInput = parsed.data;
  next();
}

export function validateProjectListQuery(req: Request, res: Response, next: NextFunction) {
  const parsed = listProjectsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid project query",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  req.projectListQuery = parsed.data;
  next();
}

export function validateProjectId(req: Request, res: Response, next: NextFunction) {
  const parsed = projectIdSchema.safeParse(req.params.projectId);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  req.projectId = parsed.data;
  next();
}

export async function requireProjectInWorkspace(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const project = await findProjectInWorkspace(
      req.workspaceMembership!.workspaceId,
      req.projectId!,
    );
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
}
