import type { NextFunction, Request, Response } from "express";
import {
  boardStatusIdParamSchema,
  createBoardColumnSchema,
  deleteBoardColumnSchema,
  updateBoardColumnSchema,
} from "./board.validation.js";

export function validateCreateBoardColumn(req: Request, res: Response, next: NextFunction) {
  const parsed = createBoardColumnSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid board column input",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  req.createBoardColumnInput = parsed.data;
  next();
}

export function validateUpdateBoardColumn(req: Request, res: Response, next: NextFunction) {
  const parsed = updateBoardColumnSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid board column input",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  req.updateBoardColumnInput = parsed.data;
  next();
}

export function validateDeleteBoardColumn(req: Request, res: Response, next: NextFunction) {
  const parsed = deleteBoardColumnSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid board column deletion input",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  req.deleteBoardColumnInput = parsed.data;
  next();
}

export function validateBoardStatusId(req: Request, res: Response, next: NextFunction) {
  const parsed = boardStatusIdParamSchema.safeParse(req.params.statusId);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid board column id" });
    return;
  }
  req.statusId = parsed.data;
  next();
}
