import { and, count, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { db } from "../../config/db.connection.js";
import { activityLogsTable } from "../../db/schema/activity-logs.schema.js";
import type { ActivityListInput, LogActivityInput } from "./activity.types.js";

export type ActivityTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function insertActivity(tx: ActivityTransaction, input: LogActivityInput) {
  return tx.insert(activityLogsTable).values({
    workspaceId: input.workspaceId,
    workspaceName: input.workspaceName ?? null,
    actorId: input.actor?.id ?? null,
    actorName: input.actor?.name ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    entityName: input.entityName ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function listActivities(input: ActivityListInput) {
  const filters = [eq(activityLogsTable.workspaceId, input.workspaceId)];
  if (input.action) filters.push(eq(activityLogsTable.action, input.action));
  if (input.actorId) filters.push(eq(activityLogsTable.actorId, input.actorId));
  if (input.entityType) filters.push(eq(activityLogsTable.entityType, input.entityType));
  if (input.from) filters.push(gte(activityLogsTable.createdAt, new Date(input.from)));
  if (input.to) {
    const end = new Date(input.to);
    if (/^\d{4}-\d{2}-\d{2}$/.test(input.to)) end.setUTCHours(23, 59, 59, 999);
    filters.push(lte(activityLogsTable.createdAt, end));
  }
  if (input.projectId) {
    filters.push(or(
      and(eq(activityLogsTable.entityType, "PROJECT"), eq(activityLogsTable.entityId, input.projectId)),
      sql`${activityLogsTable.metadata}->>'projectId' = ${input.projectId}`,
    )!);
  }
  if (input.taskId) {
    filters.push(and(
      eq(activityLogsTable.entityType, "TASK"),
      eq(activityLogsTable.entityId, input.taskId),
    )!);
  }

  const where = and(...filters);
  const [activities, [{ total }]] = await Promise.all([
    db.select().from(activityLogsTable).where(where)
      .orderBy(desc(activityLogsTable.createdAt), desc(activityLogsTable.id))
      .limit(input.pageSize).offset((input.page - 1) * input.pageSize),
    db.select({ total: count() }).from(activityLogsTable).where(where),
  ]);

  return {
    activities,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.ceil(total / input.pageSize),
    },
  };
}
