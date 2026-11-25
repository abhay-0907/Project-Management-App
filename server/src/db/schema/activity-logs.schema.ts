import {
  foreignKey,
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users.schema.js";
import { workspacesTable } from "./workspaces.schema.js";

export const activityLogsTable = pgTable(
  "activity_logs",
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .references(() => workspacesTable.id, { onDelete: "set null" }),
    workspaceName: varchar("workspace_name", { length: 150 }),
    actorId: uuid("actor_id"),
    actorName: varchar("actor_name", { length: 100 }),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    entityName: varchar("entity_name", { length: 255 }),
    action: varchar({ length: 100 }).notNull(),
    metadata: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "activity_logs_actor_user_fk",
      columns: [table.actorId],
      foreignColumns: [usersTable.id],
    }).onDelete("set null"),
    index("activity_logs_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
    index("activity_logs_entity_idx").on(table.entityType, table.entityId),
    index("activity_logs_workspace_action_created_idx").on(
      table.workspaceId,
      table.action,
      table.createdAt,
    ),
    index("activity_logs_workspace_actor_created_idx").on(
      table.workspaceId,
      table.actorId,
      table.createdAt,
    ),
  ],
);

export type ActivityLog = typeof activityLogsTable.$inferSelect;
export type NewActivityLog = typeof activityLogsTable.$inferInsert;
