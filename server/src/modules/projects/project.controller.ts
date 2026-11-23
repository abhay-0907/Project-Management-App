import type { Request, Response } from "express";
import {
  createProjectService,
  deleteProjectService,
  getProjectDetailsService,
  isProjectError,
  listProjectsService,
  updateProjectService,
} from "./project.service.js";

export async function createProjectController(req: Request, res: Response) {
  try {
    const project = await createProjectService(
      req.workspaceMembership!.workspaceId,
      req.auth!.user.id,
      req.createProjectInput!,
    );
    return res.status(201).json({ project, message: "Project created successfully" });
  } catch (error) {
    return handleError(res, error, "Project creation failed");
  }
}

export async function listProjectsController(req: Request, res: Response) {
  try {
    const result = await listProjectsService(
      req.workspaceMembership!.workspaceId,
      req.projectListQuery!,
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, "Project listing failed");
  }
}

export async function projectDetailsController(req: Request, res: Response) {
  try {
    const project = await getProjectDetailsService(
      req.workspaceMembership!.workspaceId,
      req.projectId!,
    );
    return res.status(200).json({ project });
  } catch (error) {
    return handleError(res, error, "Project lookup failed");
  }
}

export async function updateProjectController(req: Request, res: Response) {
  try {
    const project = await updateProjectService(
      req.workspaceMembership!.workspaceId,
      req.projectId!,
      req.updateProjectInput!,
    );
    return res.status(200).json({ project, message: "Project updated successfully" });
  } catch (error) {
    return handleError(res, error, "Project update failed");
  }
}

export async function deleteProjectController(req: Request, res: Response) {
  try {
    await deleteProjectService(req.workspaceMembership!.workspaceId, req.projectId!);
    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    return handleError(res, error, "Project deletion failed");
  }
}

function handleError(res: Response, error: unknown, fallback: string) {
  if (isProjectError(error)) return res.status(error.status).json({ error: error.message });
  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
}
