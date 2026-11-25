import type { ActivityAction, ActivityEntityType } from "./activity.constants.js";

export type ActivityActor = { id: string; name: string };

export type LogActivityInput = {
  workspaceId: string;
  workspaceName?: string | null;
  actor: ActivityActor | null;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityName?: string | null;
  metadata?: Record<string, unknown>;
};

export type ActivityListQuery = {
  page: number;
  pageSize: number;
  action?: ActivityAction;
  actorId?: string;
  entityType?: ActivityEntityType;
  from?: string;
  to?: string;
};

export type ActivityListInput = ActivityListQuery & {
  workspaceId: string;
  projectId?: string;
  taskId?: string;
};

declare global {
  namespace Express {
    interface Request {
      activityListQuery?: ActivityListQuery;
    }
  }
}
