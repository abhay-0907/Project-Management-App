import { sql } from "drizzle-orm";
import {
  check,
  date,
  doublePrecision,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  text,
} from "drizzle-orm/pg-core";
import { projectStatusesTable } from "./project-statuses.schema.js";
import { projectsTable } from "./projects.schema.js";
import { usersTable } from "./users.schema.js";
import { workspaceMembersTable } from "./workspace-members.schema.js";

export const taskPriorityValues = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

export const taskPriorityEnum = pgEnum("task_priority", taskPriorityValues);

export const tasksTable = pgTable(
  "tasks",
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    projectId: uuid("project_id").notNull(),
    statusId: uuid("status_id").notNull(),
    parentTaskId: uuid("parent_task_id"),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    assigneeId: uuid("assignee_id"),
    createdBy: uuid("created_by").notNull(),
    priority: taskPriorityEnum().notNull().default("MEDIUM"),
    position: doublePrecision().notNull().default(0),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "tasks_project_workspace_fk",
      columns: [table.workspaceId, table.projectId],
      foreignColumns: [projectsTable.workspaceId, projectsTable.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "tasks_status_project_workspace_fk",
      columns: [table.statusId, table.projectId, table.workspaceId],
      foreignColumns: [
        projectStatusesTable.id,
        projectStatusesTable.projectId,
        projectStatusesTable.workspaceId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "tasks_assignee_workspace_member_fk",
      columns: [table.workspaceId, table.assigneeId],
      foreignColumns: [workspaceMembersTable.workspaceId, workspaceMembersTable.userId],
    }).onDelete("restrict"),
    foreignKey({
      name: "tasks_creator_user_fk",
      columns: [table.createdBy],
      foreignColumns: [usersTable.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "tasks_parent_same_project_workspace_fk",
      columns: [table.parentTaskId, table.projectId, table.workspaceId],
      foreignColumns: [table.id, table.projectId, table.workspaceId],
    }).onDelete("restrict"),
    uniqueIndex("tasks_id_workspace_uidx").on(table.id, table.workspaceId),
    uniqueIndex("tasks_id_project_workspace_uidx").on(
      table.id,
      table.projectId,
      table.workspaceId,
    ),
    index("tasks_project_status_position_idx").on(
      table.projectId,
      table.statusId,
      table.position,
    ),
    index("tasks_workspace_assignee_idx").on(table.workspaceId, table.assigneeId),
    index("tasks_workspace_due_date_idx").on(table.workspaceId, table.dueDate),
    check(
      "tasks_date_order_check",
      sql`${table.dueDate} IS NULL OR ${table.startDate} IS NULL OR ${table.dueDate} >= ${table.startDate}`,
    ),
  ],
);

export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;
