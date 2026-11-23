import { Router } from "express";
import { requireWorkspaceRole } from "../workspaces/workspace.middleware.js";
import {
  createBoardColumnController,
  deleteBoardColumnController,
  getProjectBoardController,
  updateBoardColumnController,
} from "./board.controller.js";
import {
  validateBoardStatusId,
  validateCreateBoardColumn,
  validateDeleteBoardColumn,
  validateUpdateBoardColumn,
} from "./board.middleware.js";

const router = Router({ mergeParams: true });

router.get("/", getProjectBoardController);
router.post(
  "/columns",
  requireWorkspaceRole("OWNER", "ADMIN"),
  validateCreateBoardColumn,
  createBoardColumnController,
);
router.patch(
  "/columns/:statusId",
  validateBoardStatusId,
  requireWorkspaceRole("OWNER", "ADMIN"),
  validateUpdateBoardColumn,
  updateBoardColumnController,
);
router.delete(
  "/columns/:statusId",
  validateBoardStatusId,
  requireWorkspaceRole("OWNER", "ADMIN"),
  validateDeleteBoardColumn,
  deleteBoardColumnController,
);

export default router;
