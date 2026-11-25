import type { NextFunction, Request, Response } from "express";
import { getActivities } from "./activity.service.js";
import { activityQuerySchema } from "./activity.validation.js";

export async function listActivitiesController(req: Request, res: Response) {
  try {
    const result = await getActivities({
      ...req.activityListQuery!,
      workspaceId: req.workspaceMembership!.workspaceId,
      projectId: req.params.projectId,
      taskId: req.params.taskId,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Activity request failed", error);
    return res.status(500).json({ error: "Activity request failed" });
  }
}

export function validateActivityQueryController(req: Request, res: Response, next: NextFunction) {
  const parsed = activityQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid activity query", details: parsed.error.flatten().fieldErrors });
    return;
  }
  req.activityListQuery = parsed.data;
  next();
}
