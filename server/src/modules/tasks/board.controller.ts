import type { Request, Response } from "express";
import { isBoardError } from "./board.errors.js";
import {
  createBoardColumnService,
  deleteBoardColumnService,
  getProjectBoardService,
  updateBoardColumnService,
} from "./board.service.js";

export async function getProjectBoardController(req: Request, res: Response) {
  try {
    const board = await getProjectBoardService(
      req.workspaceMembership!.workspaceId,
      req.projectId!,
    );
    return res.status(200).json({ board });
  } catch (error) {
    return handleBoardError(res, error, "Board lookup failed");
  }
}

export async function createBoardColumnController(req: Request, res: Response) {
  try {
    const column = await createBoardColumnService(
      req.workspaceMembership!.workspaceId,
      req.projectId!,
      req.createBoardColumnInput!,
    );
    return res.status(201).json({ column, message: "Board column created" });
  } catch (error) {
    return handleBoardError(res, error, "Board column creation failed");
  }
}

export async function updateBoardColumnController(req: Request, res: Response) {
  try {
    const column = await updateBoardColumnService(
      req.workspaceMembership!.workspaceId,
      req.projectId!,
      req.statusId!,
      req.updateBoardColumnInput!,
    );
    return res.status(200).json({ column, message: "Board column updated" });
  } catch (error) {
    return handleBoardError(res, error, "Board column update failed");
  }
}

export async function deleteBoardColumnController(req: Request, res: Response) {
  try {
    const result = await deleteBoardColumnService(
      req.workspaceMembership!.workspaceId,
      req.projectId!,
      req.statusId!,
      req.deleteBoardColumnInput!,
    );
    return res.status(200).json({ ...result, message: "Board column deleted" });
  } catch (error) {
    return handleBoardError(res, error, "Board column deletion failed");
  }
}

function handleBoardError(res: Response, error: unknown, fallback: string) {
  if (isBoardError(error)) return res.status(error.status).json({ error: error.message });
  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
}
