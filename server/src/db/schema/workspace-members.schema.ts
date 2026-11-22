import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users.schema.js";
import { workspacesTable } from "./workspaces.schema.js";

export const workspaceRoleEnum = pgEnum("workspace_role", ["OWNER", "ADMIN", "MEMBER"]);

export const workspaceMembersTable = pgTable(
  "workspace_members",
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum().notNull().default("MEMBER"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("workspace_members_workspace_user_uidx").on(
      table.workspaceId,
      table.userId,
    ),
    // This guarantees at most one owner. The workspace creation/transfer transaction
    // must also guarantee at least one owner.
    uniqueIndex("workspace_members_single_owner_uidx")
      .on(table.workspaceId)
      .where(sql`${table.role} = 'OWNER'`),
    index("workspace_members_user_id_idx").on(table.userId),
  ],
);

export type WorkspaceMember = typeof workspaceMembersTable.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembersTable.$inferInsert;
