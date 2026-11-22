import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { projectsTable } from "./projects.schema.js";

export const projectStatusesTable = pgTable(
  "project_statuses",
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    projectId: uuid("project_id").notNull(),
    name: varchar({ length: 100 }).notNull(),
    slug: varchar({ length: 100 }).notNull(),
    position: integer().notNull(),
    color: varchar({ length: 30 }),
    isDefault: boolean("is_default").notNull().default(false),
    isCompleted: boolean("is_completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("project_statuses_project_slug_uidx").on(table.projectId, table.slug),
    uniqueIndex("project_statuses_tenant_candidate_uidx").on(
      table.id,
      table.projectId,
      table.workspaceId,
    ),
    uniqueIndex("project_statuses_one_default_uidx")
      .on(table.projectId)
      .where(sql`${table.isDefault} = true`),
    index("project_statuses_project_position_idx").on(table.projectId, table.position),
    foreignKey({
      name: "project_statuses_project_workspace_fk",
      columns: [table.workspaceId, table.projectId],
      foreignColumns: [projectsTable.workspaceId, projectsTable.id],
    }).onDelete("cascade"),
  ],
);

export type ProjectStatus = typeof projectStatusesTable.$inferSelect;
export type NewProjectStatus = typeof projectStatusesTable.$inferInsert;
