import { foreignKey, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { workspaceMembersTable } from "./workspace-members.schema.js";
import { workspacesTable } from "./workspaces.schema.js";

export const notificationsTable = pgTable(
  "notifications",
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    type: varchar({ length: 100 }).notNull(),
    title: varchar({ length: 255 }).notNull(),
    message: text().notNull(),
    entityType: varchar("entity_type", { length: 50 }),
    entityId: uuid("entity_id"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "notifications_recipient_workspace_member_fk",
      columns: [table.workspaceId, table.userId],
      foreignColumns: [workspaceMembersTable.workspaceId, workspaceMembersTable.userId],
    }).onDelete("cascade"),
    index("notifications_user_read_created_idx").on(
      table.userId,
      table.readAt,
      table.createdAt,
    ),
    index("notifications_workspace_created_idx").on(table.workspaceId, table.createdAt),
  ],
);

export type Notification = typeof notificationsTable.$inferSelect;
export type NewNotification = typeof notificationsTable.$inferInsert;
