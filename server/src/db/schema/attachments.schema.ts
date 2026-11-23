import { bigint, foreignKey, index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { tasksTable } from "./tasks.schema.js";
import { usersTable } from "./users.schema.js";

export const attachmentsTable = pgTable(
  "attachments",
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    taskId: uuid("task_id").notNull(),
    uploadedBy: uuid("uploaded_by").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    storageKey: varchar("storage_key", { length: 500 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    fileSize: bigint("file_size", { mode: "bigint" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "attachments_task_workspace_fk",
      columns: [table.taskId, table.workspaceId],
      foreignColumns: [tasksTable.id, tasksTable.workspaceId],
    }).onDelete("cascade"),
    foreignKey({
      name: "attachments_uploader_user_fk",
      columns: [table.uploadedBy],
      foreignColumns: [usersTable.id],
    }).onDelete("restrict"),
    index("attachments_task_created_idx").on(table.taskId, table.createdAt),
  ],
);

export type Attachment = typeof attachmentsTable.$inferSelect;
export type NewAttachment = typeof attachmentsTable.$inferInsert;
