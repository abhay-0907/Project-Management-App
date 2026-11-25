import type { Request, Response } from "express";
import {
  createWorkspaceService,
  deleteWorkspaceService,
  getUserWorkspacesService,
  getWorkspaceService,
  updateWorkspaceService,
  WorkspaceError,
} from "./workspace.service.js";

export async function createWorkspaceController(req: Request, res: Response) {
  try {
    const workspace = await createWorkspaceService(
      req.createWorkspaceInput!,
      { id: req.auth!.user.id, name: req.auth!.user.name },
    );
    return res.status(201).json({
      workspace: { ...workspace, role: "OWNER" },
      message: "Workspace created successfully",
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function userWorkspacesController(req: Request, res: Response) {
  try {
    const workspaces = await getUserWorkspacesService(req.auth!.user.id);
    return res.status(200).json({ workspaces });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function workspaceDetailsController(req: Request, res: Response) {
  try {
    const workspace = await getWorkspaceService(req.workspaceMembership!.workspaceId);
    return res.status(200).json({
      workspace: { ...workspace, role: req.workspaceMembership!.role },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateWorkspaceController(req: Request, res: Response) {
  try {
    const workspace = await updateWorkspaceService(
      req.workspaceMembership!.workspaceId,
      req.updateWorkspaceInput!,
      { id: req.auth!.user.id, name: req.auth!.user.name },
    );
    return res.status(200).json({
      workspace: { ...workspace, role: req.workspaceMembership!.role },
      message: "Workspace updated successfully",
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteWorkspaceController(req: Request, res: Response) {
  try {
    await deleteWorkspaceService(req.workspaceMembership!.workspaceId, {
      id: req.auth!.user.id,
      name: req.auth!.user.name,
    });
    return res.status(200).json({ message: "Workspace deleted successfully" });
  } catch (error) {
    return handleError(res, error);
  }
}

function handleError(res: Response, error: unknown) {
  if (error instanceof WorkspaceError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("Workspace request failed", error);
  return res.status(500).json({ error: "Workspace request failed" });
}
