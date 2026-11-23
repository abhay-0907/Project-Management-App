import { foreignKey, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tasksTable } from "./tasks.schema.js";
import { usersTable } from "./users.schema.js";

export const commentsTable = pgTable(
  "comments",
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    taskId: uuid("task_id").notNull(),
    authorId: uuid("author_id").notNull(),
    content: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "comments_task_workspace_fk",
      columns: [table.taskId, table.workspaceId],
      foreignColumns: [tasksTable.id, tasksTable.workspaceId],
    }).onDelete("cascade"),
    foreignKey({
      name: "comments_author_user_fk",
      columns: [table.authorId],
      foreignColumns: [usersTable.id],
    }).onDelete("restrict"),
    index("comments_task_created_idx").on(table.taskId, table.createdAt),
    index("comments_workspace_id_idx").on(table.workspaceId),
  ],
);

export type Comment = typeof commentsTable.$inferSelect;
export type NewComment = typeof commentsTable.$inferInsert;
