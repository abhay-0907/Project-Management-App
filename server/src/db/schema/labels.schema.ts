import { index, pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { workspacesTable } from "./workspaces.schema.js";

export const labelsTable = pgTable(
  "labels",
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 80 }).notNull(),
    color: varchar({ length: 30 }),
  },
  (table) => [
    uniqueIndex("labels_workspace_name_uidx").on(table.workspaceId, table.name),
    uniqueIndex("labels_id_workspace_uidx").on(table.id, table.workspaceId),
    index("labels_workspace_id_idx").on(table.workspaceId),
  ],
);

export type Label = typeof labelsTable.$inferSelect;
export type NewLabel = typeof labelsTable.$inferInsert;
