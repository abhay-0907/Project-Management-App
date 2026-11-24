import type { NextFunction, Request, Response } from "express";
import { findWorkspaceMembership } from "./workspace.repository.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdSchema,
} from "./workspace.validation.js";
import type { WorkspaceRole } from "./workspace.types.js";

export async function requireWorkspaceMembership(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const parsedId = workspaceIdSchema.safeParse(req.params.workspaceId);
  if (!parsedId.success) {
    res.status(400).json({ error: "Invalid workspace id" });
    return;
  }

  try {
    const membership = await findWorkspaceMembership(parsedId.data, req.auth!.user.id);
    if (!membership) {
      res.status(403).json({ error: "Workspace membership required" });
      return;
    }
    req.workspaceMembership = membership;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireWorkspaceRole(...roles: WorkspaceRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.workspaceMembership || !roles.includes(req.workspaceMembership.role)) {
      res.status(403).json({ error: "You do not have permission to perform this action" });
      return;
    }
    next();
  };
}

export function validateCreateWorkspace(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const parsed = createWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid workspace input",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  req.createWorkspaceInput = parsed.data;
  next();
}

export function validateUpdateWorkspace(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const parsed = updateWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid workspace input",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  req.updateWorkspaceInput = parsed.data;
  next();
}
