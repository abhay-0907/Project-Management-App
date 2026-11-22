import {
  foreignKey,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { projectsTable } from "./projects.schema.js";
import { workspaceMembersTable } from "./workspace-members.schema.js";

export const projectMemberRoleEnum = pgEnum("project_member_role", [
  "PROJECT_MANAGER",
  "MEMBER",
  "VIEWER",
]);

export const projectMembersTable = pgTable(
  "project_members",
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    projectId: uuid("project_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: projectMemberRoleEnum().notNull().default("MEMBER"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("project_members_project_user_uidx").on(table.projectId, table.userId),
    foreignKey({
      name: "project_members_project_workspace_fk",
      columns: [table.workspaceId, table.projectId],
      foreignColumns: [projectsTable.workspaceId, projectsTable.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "project_members_workspace_user_fk",
      columns: [table.workspaceId, table.userId],
      foreignColumns: [workspaceMembersTable.workspaceId, workspaceMembersTable.userId],
    }).onDelete("cascade"),
    index("project_members_user_id_idx").on(table.userId),
  ],
);

export type ProjectMember = typeof projectMembersTable.$inferSelect;
export type NewProjectMember = typeof projectMembersTable.$inferInsert;
