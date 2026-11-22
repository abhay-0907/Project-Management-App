import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users.schema.js";
import { workspaceMembersTable } from "./workspace-members.schema.js";
import { workspacesTable } from "./workspaces.schema.js";

export const invitationRoleEnum = pgEnum("invitation_role", ["ADMIN", "MEMBER"]);
export const invitationStatusEnum = pgEnum("invitation_status", [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "REVOKED",
]);

export const invitationsTable = pgTable(
  "invitations",
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    email: varchar({ length: 255 }).notNull(),
    role: invitationRoleEnum().notNull().default("MEMBER"),
    tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
    status: invitationStatusEnum().notNull().default("PENDING"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "invitations_workspace_inviter_membership_fk",
      columns: [table.workspaceId, table.invitedBy],
      foreignColumns: [workspaceMembersTable.workspaceId, workspaceMembersTable.userId],
    }).onDelete("restrict"),
    uniqueIndex("invitations_pending_email_uidx")
      .on(table.workspaceId, sql`lower(${table.email})`)
      .where(sql`${table.status} = 'PENDING'`),
    index("invitations_workspace_status_idx").on(table.workspaceId, table.status),
    index("invitations_expires_at_idx").on(table.expiresAt),
  ],
);

export type Invitation = typeof invitationsTable.$inferSelect;
export type NewInvitation = typeof invitationsTable.$inferInsert;
