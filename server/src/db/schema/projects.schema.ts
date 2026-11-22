import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  pgEnum,
  pgTable,
  timestamp,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users.schema.js";
import { workspacesTable } from "./workspaces.schema.js";

export const projectLifecycleEnum = pgEnum("project_lifecycle", [
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
]);

export const projectsTable = pgTable(
  "projects",
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 150 }).notNull(),
    description: text(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    status: projectLifecycleEnum().notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Candidate key used by tenant-safe composite foreign keys.
    uniqueIndex("projects_workspace_id_uidx").on(table.workspaceId, table.id),
    index("projects_workspace_status_idx").on(table.workspaceId, table.status),
    index("projects_created_by_idx").on(table.createdBy),
    check(
      "projects_date_order_check",
      sql`${table.dueDate} IS NULL OR ${table.startDate} IS NULL OR ${table.dueDate} >= ${table.startDate}`,
    ),
  ],
);

export type Project = typeof projectsTable.$inferSelect;
export type NewProject = typeof projectsTable.$inferInsert;
