import { foreignKey, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { labelsTable } from "./labels.schema.js";
import { tasksTable } from "./tasks.schema.js";

export const taskLabelsTable = pgTable(
  "task_labels",
  {
    workspaceId: uuid("workspace_id").notNull(),
    taskId: uuid("task_id").notNull(),
    labelId: uuid("label_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.labelId] }),
    foreignKey({
      name: "task_labels_task_workspace_fk",
      columns: [table.taskId, table.workspaceId],
      foreignColumns: [tasksTable.id, tasksTable.workspaceId],
    }).onDelete("cascade"),
    foreignKey({
      name: "task_labels_label_workspace_fk",
      columns: [table.labelId, table.workspaceId],
      foreignColumns: [labelsTable.id, labelsTable.workspaceId],
    }).onDelete("cascade"),
  ],
);
