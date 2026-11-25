import {
  and,
  asc,
  count,
  eq,
  getTableColumns,
  max,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../config/db.connection.js";
import { projectStatusesTable } from "../../db/schema/project-statuses.schema.js";
import { projectsTable } from "../../db/schema/projects.schema.js";
import { tasksTable } from "../../db/schema/tasks.schema.js";
import { workspacesTable } from "../../db/schema/workspaces.schema.js";
import { logActivity } from "../activity-logs/activity.service.js";
import type { ActivityActor } from "../activity-logs/activity.types.js";
import { usersTable } from "../../db/schema/users.schema.js";
import { BoardError } from "./board.errors.js";
import type {
  CreateBoardColumnInput,
  DeleteBoardColumnInput,
  UpdateBoardColumnInput,
} from "./board.validation.js";

export async function getProjectBoard(workspaceId: string, projectId: string) {
  const taskAssignee = alias(usersTable, "board_task_assignee");
  const [projectRows, statuses, taskRows] = await Promise.all([
    db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.workspaceId, workspaceId), eq(projectsTable.id, projectId)))
      .limit(1),
    db
      .select()
      .from(projectStatusesTable)
      .where(
        and(
          eq(projectStatusesTable.workspaceId, workspaceId),
          eq(projectStatusesTable.projectId, projectId),
        ),
      )
      .orderBy(asc(projectStatusesTable.position), asc(projectStatusesTable.id)),
    db
      .select({
        ...getTableColumns(tasksTable),
        assignee: {
          id: taskAssignee.id,
          name: taskAssignee.name,
          email: taskAssignee.email,
        },
      })
      .from(tasksTable)
      .leftJoin(taskAssignee, eq(tasksTable.assigneeId, taskAssignee.id))
      .where(and(eq(tasksTable.workspaceId, workspaceId), eq(tasksTable.projectId, projectId)))
      .orderBy(asc(tasksTable.statusId), asc(tasksTable.position), asc(tasksTable.id)),
  ]);

  const project = projectRows[0];
  if (!project) return null;

  const columns = statuses.map((status) => ({
    ...status,
    color: status.color ?? "#94a3b8",
    tasks: [] as Array<(typeof taskRows)[number] & {
      status: { id: string; name: string; slug: string; color: string; isCompleted: boolean };
    }>,
  }));
  const columnById = new Map(columns.map((column) => [column.id, column]));

  for (const task of taskRows) {
    const column = columnById.get(task.statusId);
    if (!column) continue;
    column.tasks.push({
      ...task,
      status: {
        id: column.id,
        name: column.name,
        slug: column.slug,
        color: column.color,
        isCompleted: column.isCompleted,
      },
    });
  }

  return {
    project,
    columns,
    totalTasks: taskRows.length,
  };
}

export async function createBoardColumn(
  workspaceId: string,
  projectId: string,
  slug: string,
  input: CreateBoardColumnInput,
  actor: ActivityActor,
) {
  return db.transaction(async (tx) => {
    await lockProject(tx, workspaceId, projectId);
    const statuses = await tx
      .select()
      .from(projectStatusesTable)
      .where(
        and(
          eq(projectStatusesTable.workspaceId, workspaceId),
          eq(projectStatusesTable.projectId, projectId),
        ),
      )
      .orderBy(asc(projectStatusesTable.position));
    if (statuses.some((status) => status.slug === slug)) {
      throw new BoardError(409, "A board column with this name already exists");
    }

    const isDefault = statuses.length === 0 || input.isDefault === true;
    if (isDefault) {
      await tx
        .update(projectStatusesTable)
        .set({ isDefault: false })
        .where(eq(projectStatusesTable.projectId, projectId));
    }

    const [created] = await tx
      .insert(projectStatusesTable)
      .values({
        workspaceId,
        projectId,
        name: input.name,
        slug,
        position: statuses.length,
        color: input.color ?? "#94a3b8",
        isDefault,
        isCompleted: input.isCompleted ?? false,
      })
      .returning();
    if (created) {
      const [workspace] = await tx.select({ name: workspacesTable.name }).from(workspacesTable)
        .where(eq(workspacesTable.id, workspaceId)).limit(1);
      await logActivity(tx, {
        workspaceId,
        workspaceName: workspace?.name,
        actor,
        action: "BOARD_COLUMN_CREATED",
        entityType: "BOARD_COLUMN",
        entityId: created.id,
        entityName: created.name,
        metadata: { projectId, name: created.name, position: created.position },
      });
    }
    return created ?? null;
  });
}

export async function updateBoardColumn(
  workspaceId: string,
  projectId: string,
  statusId: string,
  slug: string | undefined,
  input: UpdateBoardColumnInput,
  actor: ActivityActor,
) {
  return db.transaction(async (tx) => {
    await lockProject(tx, workspaceId, projectId);
    const statuses = await tx
      .select()
      .from(projectStatusesTable)
      .where(
        and(
          eq(projectStatusesTable.workspaceId, workspaceId),
          eq(projectStatusesTable.projectId, projectId),
        ),
      )
      .orderBy(asc(projectStatusesTable.position))
      .for("update");
    const current = statuses.find((status) => status.id === statusId);
    if (!current) return null;
    if (slug && statuses.some((status) => status.id !== statusId && status.slug === slug)) {
      throw new BoardError(409, "A board column with this name already exists");
    }
    if (input.isDefault === false && current.isDefault) {
      throw new BoardError(409, "The board must keep a default column");
    }

    if (input.isDefault === true && !current.isDefault) {
      await tx
        .update(projectStatusesTable)
        .set({ isDefault: false })
        .where(eq(projectStatusesTable.projectId, projectId));
    }

    let updatedPosition = current.position;
    if (input.position !== undefined && input.position !== current.position) {
      const reordered = statuses.filter((status) => status.id !== statusId);
      const insertionIndex = Math.min(input.position, reordered.length);
      reordered.splice(insertionIndex, 0, current);
      updatedPosition = insertionIndex;
      for (const [position, status] of reordered.entries()) {
        await tx
          .update(projectStatusesTable)
          .set({ position })
          .where(eq(projectStatusesTable.id, status.id));
      }
    }

    const update: Partial<typeof projectStatusesTable.$inferInsert> = {};
    if (input.name !== undefined) update.name = input.name;
    if (slug !== undefined) update.slug = slug;
    if (input.position !== undefined) update.position = updatedPosition;
    if (input.color !== undefined) update.color = input.color;
    if (input.isDefault !== undefined) update.isDefault = input.isDefault;
    if (input.isCompleted !== undefined) update.isCompleted = input.isCompleted;

    if (Object.keys(update).length === 0) return current;
    if (input.isCompleted !== undefined && input.isCompleted !== current.isCompleted) {
      await tx
        .update(tasksTable)
        .set({
          completedAt: input.isCompleted
            ? sql`coalesce(${tasksTable.completedAt}, now())`
            : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tasksTable.workspaceId, workspaceId),
            eq(tasksTable.projectId, projectId),
            eq(tasksTable.statusId, statusId),
          ),
        );
    }
    const [updated] = await tx
      .update(projectStatusesTable)
      .set(update)
      .where(
        and(
          eq(projectStatusesTable.workspaceId, workspaceId),
          eq(projectStatusesTable.projectId, projectId),
          eq(projectStatusesTable.id, statusId),
        ),
      )
      .returning();
    if (!updated) return null;
    const [workspace] = await tx.select({ name: workspacesTable.name }).from(workspacesTable)
      .where(eq(workspacesTable.id, workspaceId)).limit(1);
    const base = {
      workspaceId,
      workspaceName: workspace?.name,
      actor,
      entityType: "BOARD_COLUMN" as const,
      entityId: updated.id,
      entityName: updated.name,
    };
    if (input.name !== undefined && input.name !== current.name) {
      await logActivity(tx, {
        ...base,
        action: "BOARD_COLUMN_RENAMED",
        metadata: { projectId, changes: { name: { old: current.name, new: updated.name } } },
      });
    }
    if (input.position !== undefined && input.position !== current.position) {
      await logActivity(tx, {
        ...base,
        action: "BOARD_COLUMN_REORDERED",
        metadata: { projectId, changes: { position: { old: current.position, new: updated.position } } },
      });
    }
    const otherChanges: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, newValue] of Object.entries(input)) {
      if (key === "name" || key === "position") continue;
      const oldValue = current[key as keyof typeof current];
      if (oldValue !== newValue) otherChanges[key] = { old: oldValue, new: newValue };
    }
    if (Object.keys(otherChanges).length) {
      await logActivity(tx, {
        ...base,
        action: "BOARD_COLUMN_UPDATED",
        metadata: { projectId, changes: otherChanges },
      });
    }
    return updated ?? null;
  });
}

export async function deleteBoardColumn(
  workspaceId: string,
  projectId: string,
  statusId: string,
  input: DeleteBoardColumnInput,
  actor: ActivityActor,
) {
  return db.transaction(async (tx) => {
    await lockProject(tx, workspaceId, projectId);
    const statuses = await tx
      .select()
      .from(projectStatusesTable)
      .where(
        and(
          eq(projectStatusesTable.workspaceId, workspaceId),
          eq(projectStatusesTable.projectId, projectId),
        ),
      )
      .orderBy(asc(projectStatusesTable.position))
      .for("update");
    const current = statuses.find((status) => status.id === statusId);
    if (!current) return null;
    if (statuses.length <= 1) throw new BoardError(409, "A board must keep at least one column");

    const [taskTotal] = await tx
      .select({ total: count() })
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.workspaceId, workspaceId),
          eq(tasksTable.projectId, projectId),
          eq(tasksTable.statusId, statusId),
        ),
      );
    const hasTasks = (taskTotal?.total ?? 0) > 0;
    if (hasTasks && !input.reassignToStatusId) {
      throw new BoardError(409, "Choose a destination column for this column's tasks");
    }

    const remaining = statuses.filter((status) => status.id !== statusId);
    const requestedTarget = input.reassignToStatusId
      ? remaining.find((status) => status.id === input.reassignToStatusId)
      : undefined;
    if (input.reassignToStatusId && !requestedTarget) {
      throw new BoardError(400, "The destination must be another column in this project");
    }
    const defaultReplacement = requestedTarget ?? remaining[0]!;
    const affectedTasks = hasTasks
      ? await tx.select({ id: tasksTable.id, title: tasksTable.title }).from(tasksTable).where(and(
          eq(tasksTable.workspaceId, workspaceId),
          eq(tasksTable.projectId, projectId),
          eq(tasksTable.statusId, statusId),
        )).for("update")
      : [];
    if (hasTasks) {
      const [targetMax] = await tx
        .select({ value: max(tasksTable.position) })
        .from(tasksTable)
        .where(
          and(
            eq(tasksTable.workspaceId, workspaceId),
            eq(tasksTable.projectId, projectId),
            eq(tasksTable.statusId, defaultReplacement.id),
          ),
        );
      await tx
        .update(tasksTable)
        .set({
          statusId: defaultReplacement.id,
          position: sql`${tasksTable.position} + ${(targetMax?.value ?? -1) + 1}`,
          completedAt: defaultReplacement.isCompleted
            ? sql`coalesce(${tasksTable.completedAt}, now())`
            : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tasksTable.workspaceId, workspaceId),
            eq(tasksTable.projectId, projectId),
            eq(tasksTable.statusId, statusId),
          ),
        );
      const [workspace] = await tx.select({ name: workspacesTable.name }).from(workspacesTable)
        .where(eq(workspacesTable.id, workspaceId)).limit(1);
      for (const task of affectedTasks) {
        await logActivity(tx, {
          workspaceId,
          workspaceName: workspace?.name,
          actor,
          action: "TASK_STATUS_CHANGED",
          entityType: "TASK",
          entityId: task.id,
          entityName: task.title,
          metadata: {
            projectId,
            changes: {
              status: {
                old: { id: current.id, name: current.name },
                new: { id: defaultReplacement.id, name: defaultReplacement.name },
              },
            },
            reason: "BOARD_COLUMN_DELETED",
          },
        });
      }
    }

    if (current.isDefault) {
      await tx
        .update(projectStatusesTable)
        .set({ isDefault: false })
        .where(eq(projectStatusesTable.id, current.id));
      await tx
        .update(projectStatusesTable)
        .set({ isDefault: true })
        .where(eq(projectStatusesTable.id, defaultReplacement.id));
    }

    await tx
      .delete(projectStatusesTable)
      .where(
        and(
          eq(projectStatusesTable.workspaceId, workspaceId),
          eq(projectStatusesTable.projectId, projectId),
          eq(projectStatusesTable.id, statusId),
        ),
      );

    for (const [position, status] of remaining.entries()) {
      await tx
        .update(projectStatusesTable)
        .set({ position })
        .where(eq(projectStatusesTable.id, status.id));
    }

    const [workspace] = await tx.select({ name: workspacesTable.name }).from(workspacesTable)
      .where(eq(workspacesTable.id, workspaceId)).limit(1);
    await logActivity(tx, {
      workspaceId,
      workspaceName: workspace?.name,
      actor,
      action: "BOARD_COLUMN_DELETED",
      entityType: "BOARD_COLUMN",
      entityId: current.id,
      entityName: current.name,
      metadata: {
        projectId,
        name: current.name,
        reassignedTaskCount: taskTotal?.total ?? 0,
        reassignedToStatusId: hasTasks ? defaultReplacement.id : null,
      },
    });

    return {
      deletedStatusId: statusId,
      reassignedTaskCount: taskTotal?.total ?? 0,
      reassignedToStatusId: hasTasks ? defaultReplacement.id : null,
    };
  });
}

async function lockProject(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  workspaceId: string,
  projectId: string,
) {
  const [project] = await tx
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(and(eq(projectsTable.workspaceId, workspaceId), eq(projectsTable.id, projectId)))
    .for("update")
    .limit(1);
  if (!project) throw new BoardError(404, "Project not found");
}

export function makeStatusSlug(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100) || "status"
  );
}
