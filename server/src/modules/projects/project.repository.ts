import { and, asc, count, desc, eq, getTableColumns, ilike, inArray } from "drizzle-orm";
import { db } from "../../config/db.connection.js";
import { notificationsTable } from "../../db/schema/notifications.schema.js";
import { projectsTable, type NewProject } from "../../db/schema/projects.schema.js";
import { projectStatusesTable } from "../../db/schema/project-statuses.schema.js";
import { tasksTable } from "../../db/schema/tasks.schema.js";
import { usersTable } from "../../db/schema/users.schema.js";
import { workspacesTable } from "../../db/schema/workspaces.schema.js";
import { logActivity } from "../activity-logs/activity.service.js";
import type { ActivityActor } from "../activity-logs/activity.types.js";
import { DEFAULT_PROJECT_STATUSES } from "./project-status.defaults.js";
import type { ListProjectsQuery, UpdateProjectInput } from "./project.validation.js";

export async function createProject(project: NewProject, actor: ActivityActor) {
  return db.transaction(async (tx) => {
    const [created] = await tx.insert(projectsTable).values(project).returning();
    if (!created) return null;

    await tx.insert(projectStatusesTable).values(
      DEFAULT_PROJECT_STATUSES.map((status) => ({
        ...status,
        projectId: created.id,
        workspaceId: created.workspaceId,
      })),
    );

    const [workspace] = await tx.select({ name: workspacesTable.name }).from(workspacesTable)
      .where(eq(workspacesTable.id, created.workspaceId)).limit(1);
    await logActivity(tx, {
      workspaceId: created.workspaceId,
      workspaceName: workspace?.name,
      actor,
      action: "PROJECT_CREATED",
      entityType: "PROJECT",
      entityId: created.id,
      entityName: created.name,
      metadata: { name: created.name, status: created.status },
    });

    return created;
  });
}

export async function listWorkspaceProjects(
  workspaceId: string,
  query: ListProjectsQuery,
) {
  const filters = [eq(projectsTable.workspaceId, workspaceId)];
  if (query.status) filters.push(eq(projectsTable.status, query.status));
  if (query.search) filters.push(ilike(projectsTable.name, `%${query.search}%`));
  const where = and(...filters);
  const orderBy =
    query.sort === "newest"
      ? [desc(projectsTable.createdAt)]
      : query.sort === "name"
        ? [asc(projectsTable.name), desc(projectsTable.createdAt)]
        : [desc(projectsTable.updatedAt)];

  const [projects, [{ total }], statusRows] = await Promise.all([
    db
      .select({
        ...getTableColumns(projectsTable),
        creator: { id: usersTable.id, name: usersTable.name },
      })
      .from(projectsTable)
      .innerJoin(usersTable, eq(projectsTable.createdBy, usersTable.id))
      .where(where)
      .orderBy(...orderBy)
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ total: count() }).from(projectsTable).where(where),
    db
      .select({ status: projectsTable.status, total: count() })
      .from(projectsTable)
      .where(eq(projectsTable.workspaceId, workspaceId))
      .groupBy(projectsTable.status),
  ]);

  const summary = { total: 0, active: 0, onHold: 0, completed: 0, archived: 0 };
  for (const row of statusRows) {
    summary.total += row.total;
    if (row.status === "ACTIVE") summary.active = row.total;
    if (row.status === "ON_HOLD") summary.onHold = row.total;
    if (row.status === "COMPLETED") summary.completed = row.total;
    if (row.status === "ARCHIVED") summary.archived = row.total;
  }

  return {
    projects,
    summary,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export async function findProjectInWorkspace(workspaceId: string, projectId: string) {
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.workspaceId, workspaceId), eq(projectsTable.id, projectId)))
    .limit(1);
  return project ?? null;
}

export async function findProjectWithCreator(workspaceId: string, projectId: string) {
  const [row] = await db
    .select({
      ...getTableColumns(projectsTable),
      creator: { id: usersTable.id, name: usersTable.name },
    })
    .from(projectsTable)
    .innerJoin(usersTable, eq(projectsTable.createdBy, usersTable.id))
    .where(and(eq(projectsTable.workspaceId, workspaceId), eq(projectsTable.id, projectId)))
    .limit(1);
  return row ?? null;
}

export async function updateProject(
  workspaceId: string,
  projectId: string,
  input: UpdateProjectInput,
  actor: ActivityActor,
) {
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(projectsTable).where(and(
      eq(projectsTable.workspaceId, workspaceId), eq(projectsTable.id, projectId),
    )).for("update").limit(1);
    if (!current) return null;
    const [project] = await tx.update(projectsTable).set({ ...input, updatedAt: new Date() })
      .where(and(eq(projectsTable.workspaceId, workspaceId), eq(projectsTable.id, projectId)))
      .returning();
    if (!project) return null;

    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, newValue] of Object.entries(input)) {
      const oldValue = current[key as keyof typeof current];
      if (oldValue !== newValue) changes[key] = { old: oldValue, new: newValue };
    }
    if (Object.keys(changes).length) {
      const [workspace] = await tx.select({ name: workspacesTable.name }).from(workspacesTable)
        .where(eq(workspacesTable.id, workspaceId)).limit(1);
      await logActivity(tx, {
        workspaceId,
        workspaceName: workspace?.name,
        actor,
        action: "PROJECT_UPDATED",
        entityType: "PROJECT",
        entityId: project.id,
        entityName: project.name,
        metadata: { changes },
      });
    }
    return project;
  });
}

export async function deleteProjectPermanently(workspaceId: string, projectId: string, actor: ActivityActor) {
  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ id: projectsTable.id, name: projectsTable.name })
      .from(projectsTable)
      .where(and(eq(projectsTable.workspaceId, workspaceId), eq(projectsTable.id, projectId)))
      .for("update")
      .limit(1);
    if (!project) return false;

    const taskRows = await tx
      .select({ id: tasksTable.id })
      .from(tasksTable)
      .where(and(eq(tasksTable.workspaceId, workspaceId), eq(tasksTable.projectId, projectId)));
    const relatedEntityIds = [projectId, ...taskRows.map((task) => task.id)];

    // Break the task self-reference before cascading project deletion. Other task-owned
    // records (comments, attachments, and labels) then cascade with the task rows.
    await tx
      .update(tasksTable)
      .set({ parentTaskId: null })
      .where(and(eq(tasksTable.workspaceId, workspaceId), eq(tasksTable.projectId, projectId)));
    const [workspace] = await tx.select({ name: workspacesTable.name }).from(workspacesTable)
      .where(eq(workspacesTable.id, workspaceId)).limit(1);
    await logActivity(tx, {
      workspaceId,
      workspaceName: workspace?.name,
      actor,
      action: "PROJECT_DELETED",
      entityType: "PROJECT",
      entityId: project.id,
      entityName: project.name,
      metadata: { name: project.name, deletedTaskCount: taskRows.length },
    });
    await tx
      .delete(notificationsTable)
      .where(
        and(
          eq(notificationsTable.workspaceId, workspaceId),
          inArray(notificationsTable.entityId, relatedEntityIds),
          inArray(notificationsTable.entityType, ["project", "task", "PROJECT", "TASK"]),
        ),
      );
    await tx
      .delete(tasksTable)
      .where(and(eq(tasksTable.workspaceId, workspaceId), eq(tasksTable.projectId, projectId)));

    const [deleted] = await tx
      .delete(projectsTable)
      .where(and(eq(projectsTable.workspaceId, workspaceId), eq(projectsTable.id, projectId)))
      .returning({ id: projectsTable.id });
    return Boolean(deleted);
  });
}
