import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  max,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../config/db.connection.js";
import { activityLogsTable } from "../../db/schema/activity-logs.schema.js";
import { notificationsTable } from "../../db/schema/notifications.schema.js";
import { projectsTable } from "../../db/schema/projects.schema.js";
import { projectStatusesTable } from "../../db/schema/project-statuses.schema.js";
import { tasksTable, type NewTask } from "../../db/schema/tasks.schema.js";
import { usersTable } from "../../db/schema/users.schema.js";
import { workspaceMembersTable } from "../../db/schema/workspace-members.schema.js";
import { DEFAULT_PROJECT_STATUSES } from "../projects/project-status.defaults.js";
import { TaskError } from "./task.errors.js";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "./task.validation.js";

export async function createTask(
  workspaceId: string,
  projectId: string,
  userId: string,
  input: CreateTaskInput,
) {
  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(and(eq(projectsTable.workspaceId, workspaceId), eq(projectsTable.id, projectId)))
      .for("update")
      .limit(1);
    if (!project) return null;

    let defaultStatus: typeof projectStatusesTable.$inferSelect | undefined;
    [defaultStatus] = await tx
      .select()
      .from(projectStatusesTable)
      .where(
        and(
          eq(projectStatusesTable.workspaceId, workspaceId),
          eq(projectStatusesTable.projectId, projectId),
          eq(projectStatusesTable.isDefault, true),
        ),
      )
      .limit(1);

    if (!defaultStatus) {
      const existingStatuses = await tx
        .select()
        .from(projectStatusesTable)
        .where(
          and(
            eq(projectStatusesTable.workspaceId, workspaceId),
            eq(projectStatusesTable.projectId, projectId),
          ),
        )
        .orderBy(asc(projectStatusesTable.position));

      if (existingStatuses.length) {
        const [promotedStatus] = await tx
          .update(projectStatusesTable)
          .set({ isDefault: true })
          .where(eq(projectStatusesTable.id, existingStatuses[0]!.id))
          .returning();
        defaultStatus = promotedStatus;
      } else {
        const createdStatuses = await tx
          .insert(projectStatusesTable)
          .values(
            DEFAULT_PROJECT_STATUSES.map((status) => ({
              ...status,
              workspaceId,
              projectId,
            })),
          )
          .returning();
        defaultStatus = createdStatuses.find((status) => status.isDefault);
      }
    }

    if (!defaultStatus) throw new Error("Project default status could not be initialized");

    let taskStatus = defaultStatus;
    if (input.statusId) {
      const [requestedStatus] = await tx
        .select()
        .from(projectStatusesTable)
        .where(
          and(
            eq(projectStatusesTable.workspaceId, workspaceId),
            eq(projectStatusesTable.projectId, projectId),
            eq(projectStatusesTable.id, input.statusId),
          ),
        )
        .limit(1);
      if (!requestedStatus) throw new TaskError(400, "Status must belong to this project");
      taskStatus = requestedStatus;
    }

    if (input.assigneeId) {
      const [assignee] = await tx
        .select({ userId: workspaceMembersTable.userId })
        .from(workspaceMembersTable)
        .where(
          and(
            eq(workspaceMembersTable.workspaceId, workspaceId),
            eq(workspaceMembersTable.userId, input.assigneeId),
          ),
        )
        .limit(1);
      if (!assignee) throw new TaskError(400, "Assignee must be a member of this workspace");
    }

    if (input.parentTaskId) {
      const [parent] = await tx
        .select({ id: tasksTable.id })
        .from(tasksTable)
        .where(
          and(
            eq(tasksTable.workspaceId, workspaceId),
            eq(tasksTable.projectId, projectId),
            eq(tasksTable.id, input.parentTaskId),
          ),
        )
        .limit(1);
      if (!parent) throw new TaskError(400, "Parent task must belong to this project");
    }

    const [lastPosition] = await tx
      .select({ value: max(tasksTable.position) })
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.workspaceId, workspaceId),
          eq(tasksTable.projectId, projectId),
          eq(tasksTable.statusId, taskStatus.id),
        ),
      );

    const task: NewTask = {
      workspaceId,
      projectId,
      statusId: taskStatus.id,
      parentTaskId: input.parentTaskId ?? null,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? "MEDIUM",
      assigneeId: input.assigneeId ?? null,
      createdBy: userId,
      startDate: input.startDate ?? null,
      dueDate: input.dueDate ?? null,
      position: (lastPosition?.value ?? -1) + 1,
    };

    const [created] = await tx.insert(tasksTable).values(task).returning();
    return created ?? null;
  });
}

export async function listProjectTasks(
  workspaceId: string,
  projectId: string,
  query: ListTasksQuery,
) {
  const filters = [
    eq(tasksTable.workspaceId, workspaceId),
    eq(tasksTable.projectId, projectId),
  ];
  if (query.statusId) filters.push(eq(tasksTable.statusId, query.statusId));
  if (query.priority) filters.push(eq(tasksTable.priority, query.priority));
  if (query.assigneeId) filters.push(eq(tasksTable.assigneeId, query.assigneeId));
  const where = and(...filters);
  const orderColumn =
    query.sort === "createdAt"
      ? tasksTable.createdAt
      : query.sort === "updatedAt"
        ? tasksTable.updatedAt
        : query.sort === "dueDate"
          ? tasksTable.dueDate
          : tasksTable.position;
  const orderBy = query.order === "desc" ? desc(orderColumn) : asc(orderColumn);
  const assignee = alias(usersTable, "task_assignee");

  const [tasks, [{ total }], statuses] = await Promise.all([
    db
      .select({
        ...getTableColumns(tasksTable),
        status: {
          id: projectStatusesTable.id,
          name: projectStatusesTable.name,
          slug: projectStatusesTable.slug,
          color: projectStatusesTable.color,
          isCompleted: projectStatusesTable.isCompleted,
        },
        assignee: {
          id: assignee.id,
          name: assignee.name,
          email: assignee.email,
        },
      })
      .from(tasksTable)
      .innerJoin(
        projectStatusesTable,
        and(
          eq(tasksTable.statusId, projectStatusesTable.id),
          eq(tasksTable.projectId, projectStatusesTable.projectId),
          eq(tasksTable.workspaceId, projectStatusesTable.workspaceId),
        ),
      )
      .leftJoin(assignee, eq(tasksTable.assigneeId, assignee.id))
      .where(where)
      .orderBy(orderBy, asc(tasksTable.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ total: count() }).from(tasksTable).where(where),
    db
      .select({
        id: projectStatusesTable.id,
        name: projectStatusesTable.name,
        slug: projectStatusesTable.slug,
        position: projectStatusesTable.position,
        color: projectStatusesTable.color,
        isDefault: projectStatusesTable.isDefault,
        isCompleted: projectStatusesTable.isCompleted,
      })
      .from(projectStatusesTable)
      .where(
        and(
          eq(projectStatusesTable.workspaceId, workspaceId),
          eq(projectStatusesTable.projectId, projectId),
        ),
      )
      .orderBy(asc(projectStatusesTable.position)),
  ]);

  return {
    tasks,
    statuses,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export async function findTaskInProject(
  workspaceId: string,
  projectId: string,
  taskId: string,
) {
  const [task] = await db
    .select()
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.workspaceId, workspaceId),
        eq(tasksTable.projectId, projectId),
        eq(tasksTable.id, taskId),
      ),
    )
    .limit(1);
  return task ?? null;
}

export async function findTaskWithDetails(
  workspaceId: string,
  projectId: string,
  taskId: string,
) {
  const assignee = alias(usersTable, "task_assignee");
  const creator = alias(usersTable, "task_creator");
  const parentTask = alias(tasksTable, "parent_task");

  const [task] = await db
    .select({
      ...getTableColumns(tasksTable),
      status: {
        id: projectStatusesTable.id,
        name: projectStatusesTable.name,
        slug: projectStatusesTable.slug,
        color: projectStatusesTable.color,
        isCompleted: projectStatusesTable.isCompleted,
      },
      assignee: {
        id: assignee.id,
        name: assignee.name,
        email: assignee.email,
      },
      creator: {
        id: creator.id,
        name: creator.name,
      },
      parentTask: {
        id: parentTask.id,
        title: parentTask.title,
        statusId: parentTask.statusId,
      },
    })
    .from(tasksTable)
    .innerJoin(
      projectStatusesTable,
      and(
        eq(tasksTable.statusId, projectStatusesTable.id),
        eq(tasksTable.projectId, projectStatusesTable.projectId),
        eq(tasksTable.workspaceId, projectStatusesTable.workspaceId),
      ),
    )
    .leftJoin(assignee, eq(tasksTable.assigneeId, assignee.id))
    .innerJoin(creator, eq(tasksTable.createdBy, creator.id))
    .leftJoin(
      parentTask,
      and(
        eq(tasksTable.parentTaskId, parentTask.id),
        eq(tasksTable.projectId, parentTask.projectId),
        eq(tasksTable.workspaceId, parentTask.workspaceId),
      ),
    )
    .where(
      and(
        eq(tasksTable.workspaceId, workspaceId),
        eq(tasksTable.projectId, projectId),
        eq(tasksTable.id, taskId),
      ),
    )
    .limit(1);

  if (!task) return null;

  const [subtaskCount] = await db
    .select({ total: count() })
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.workspaceId, workspaceId),
        eq(tasksTable.projectId, projectId),
        eq(tasksTable.parentTaskId, taskId),
      ),
    );

  return { ...task, subtaskCount: subtaskCount?.total ?? 0 };
}

export async function findProjectStatus(
  workspaceId: string,
  projectId: string,
  statusId: string,
) {
  const [status] = await db
    .select({ id: projectStatusesTable.id })
    .from(projectStatusesTable)
    .where(
      and(
        eq(projectStatusesTable.workspaceId, workspaceId),
        eq(projectStatusesTable.projectId, projectId),
        eq(projectStatusesTable.id, statusId),
      ),
    )
    .limit(1);
  return status ?? null;
}

export async function updateTask(
  workspaceId: string,
  projectId: string,
  taskId: string,
  input: UpdateTaskInput,
) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.workspaceId, workspaceId),
          eq(tasksTable.projectId, projectId),
          eq(tasksTable.id, taskId),
        ),
      )
      .for("update")
      .limit(1);
    if (!current) return null;

    const startDate = input.startDate === undefined ? current.startDate : input.startDate;
    const dueDate = input.dueDate === undefined ? current.dueDate : input.dueDate;
    if (startDate && dueDate && dueDate < startDate) {
      throw new TaskError(400, "Due date cannot be earlier than the start date");
    }

    if (input.assigneeId) {
      const [assignee] = await tx
        .select({ userId: workspaceMembersTable.userId })
        .from(workspaceMembersTable)
        .where(
          and(
            eq(workspaceMembersTable.workspaceId, workspaceId),
            eq(workspaceMembersTable.userId, input.assigneeId),
          ),
        )
        .limit(1);
      if (!assignee) throw new TaskError(400, "Assignee must be a member of this workspace");
    }

    let updatedStatus: { id: string; isCompleted: boolean } | undefined;
    if (input.statusId) {
      const [status] = await tx
        .select({ id: projectStatusesTable.id, isCompleted: projectStatusesTable.isCompleted })
        .from(projectStatusesTable)
        .where(
          and(
            eq(projectStatusesTable.workspaceId, workspaceId),
            eq(projectStatusesTable.projectId, projectId),
            eq(projectStatusesTable.id, input.statusId),
          ),
        )
        .limit(1);
      if (!status) throw new TaskError(400, "Status must belong to this project");
      updatedStatus = status;
    }

    const updates: Partial<NewTask> = { ...input, updatedAt: new Date() };
    if (updatedStatus) {
      updates.completedAt = updatedStatus.isCompleted
        ? current.completedAt ?? new Date()
        : null;
      if (updatedStatus.id !== current.statusId) {
        const [lastPosition] = await tx
          .select({ value: max(tasksTable.position) })
          .from(tasksTable)
          .where(
            and(
              eq(tasksTable.workspaceId, workspaceId),
              eq(tasksTable.projectId, projectId),
              eq(tasksTable.statusId, updatedStatus.id),
            ),
          );
        updates.position = (lastPosition?.value ?? -1) + 1;
      }
    }

    const [updated] = await tx
      .update(tasksTable)
      .set(updates)
      .where(
        and(
          eq(tasksTable.workspaceId, workspaceId),
          eq(tasksTable.projectId, projectId),
          eq(tasksTable.id, taskId),
        ),
      )
      .returning();
    return updated ?? null;
  });
}

export async function deleteTask(
  workspaceId: string,
  projectId: string,
  taskId: string,
) {
  return db.transaction(async (tx) => {
    const [task] = await tx
      .select({ id: tasksTable.id })
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.workspaceId, workspaceId),
          eq(tasksTable.projectId, projectId),
          eq(tasksTable.id, taskId),
        ),
      )
      .for("update")
      .limit(1);
    if (!task) return false;

    const [childTask] = await tx
      .select({ id: tasksTable.id })
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.workspaceId, workspaceId),
          eq(tasksTable.projectId, projectId),
          eq(tasksTable.parentTaskId, taskId),
        ),
      )
      .limit(1);
    if (childTask) throw new TaskError(409, "Delete subtasks before deleting this task");

    await tx
      .delete(activityLogsTable)
      .where(
        and(
          eq(activityLogsTable.workspaceId, workspaceId),
          eq(activityLogsTable.entityId, taskId),
          inArray(activityLogsTable.entityType, ["task", "TASK"]),
        ),
      );
    await tx
      .delete(notificationsTable)
      .where(
        and(
          eq(notificationsTable.workspaceId, workspaceId),
          eq(notificationsTable.entityId, taskId),
          inArray(notificationsTable.entityType, ["task", "TASK"]),
        ),
      );

    const [deleted] = await tx
      .delete(tasksTable)
      .where(
        and(
          eq(tasksTable.workspaceId, workspaceId),
          eq(tasksTable.projectId, projectId),
          eq(tasksTable.id, taskId),
        ),
      )
      .returning({ id: tasksTable.id });
    return Boolean(deleted);
  });
}
