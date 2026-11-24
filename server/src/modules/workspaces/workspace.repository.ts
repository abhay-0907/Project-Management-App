import { and, asc, eq } from "drizzle-orm";
import { db } from "../../config/db.connection.js";
import { activityLogsTable } from "../../db/schema/activity-logs.schema.js";
import { attachmentsTable } from "../../db/schema/attachments.schema.js";
import { commentsTable } from "../../db/schema/comments.schema.js";
import { invitationsTable } from "../../db/schema/invitations.schema.js";
import { tasksTable } from "../../db/schema/tasks.schema.js";
import { workspaceMembersTable } from "../../db/schema/workspace-members.schema.js";
import { workspacesTable } from "../../db/schema/workspaces.schema.js";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "./workspace.validation.js";

export async function createWorkspace(input: CreateWorkspaceInput, userId: string) {
  return db.transaction(async (tx) => {
    const [workspace] = await tx
      .insert(workspacesTable)
      .values({ name: input.name, slug: input.slug, createdBy: userId })
      .returning();
    if (!workspace) throw new Error("Workspace creation failed");

    await tx.insert(workspaceMembersTable).values({
      workspaceId: workspace.id,
      userId,
      role: "OWNER",
    });

    return workspace;
  });
}

export async function findWorkspaceBySlug(slug: string) {
  const [workspace] = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.slug, slug))
    .limit(1);
  return workspace ?? null;
}

export async function findWorkspaceById(workspaceId: string) {
  const [workspace] = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.id, workspaceId))
    .limit(1);
  return workspace ?? null;
}

export async function findUserWorkspaces(userId: string) {
  return db
    .select({
      id: workspacesTable.id,
      name: workspacesTable.name,
      slug: workspacesTable.slug,
      createdBy: workspacesTable.createdBy,
      createdAt: workspacesTable.createdAt,
      updatedAt: workspacesTable.updatedAt,
      role: workspaceMembersTable.role,
      joinedAt: workspaceMembersTable.joinedAt,
    })
    .from(workspaceMembersTable)
    .innerJoin(workspacesTable, eq(workspaceMembersTable.workspaceId, workspacesTable.id))
    .where(eq(workspaceMembersTable.userId, userId))
    .orderBy(asc(workspacesTable.name));
}

export async function findWorkspaceMembership(workspaceId: string, userId: string) {
  const [membership] = await db
    .select({
      id: workspaceMembersTable.id,
      workspaceId: workspaceMembersTable.workspaceId,
      userId: workspaceMembersTable.userId,
      role: workspaceMembersTable.role,
      joinedAt: workspaceMembersTable.joinedAt,
    })
    .from(workspaceMembersTable)
    .where(
      and(
        eq(workspaceMembersTable.workspaceId, workspaceId),
        eq(workspaceMembersTable.userId, userId),
      ),
    )
    .limit(1);
  return membership ?? null;
}

export async function updateWorkspace(
  workspaceId: string,
  input: UpdateWorkspaceInput,
) {
  const [workspace] = await db
    .update(workspacesTable)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(workspacesTable.id, workspaceId))
    .returning();
  return workspace ?? null;
}

export async function deleteWorkspace(workspaceId: string) {
  return db.transaction(async (tx) => {
    // These rows have RESTRICT references to workspace membership.
    await tx.delete(invitationsTable).where(eq(invitationsTable.workspaceId, workspaceId));
    await tx.delete(activityLogsTable).where(eq(activityLogsTable.workspaceId, workspaceId));
    await tx.delete(commentsTable).where(eq(commentsTable.workspaceId, workspaceId));
    await tx.delete(attachmentsTable).where(eq(attachmentsTable.workspaceId, workspaceId));

    // Clear the self-reference first so tasks can be removed as a set regardless of depth.
    await tx
      .update(tasksTable)
      .set({ parentTaskId: null })
      .where(eq(tasksTable.workspaceId, workspaceId));
    await tx.delete(tasksTable).where(eq(tasksTable.workspaceId, workspaceId));

    await tx
      .delete(workspaceMembersTable)
      .where(eq(workspaceMembersTable.workspaceId, workspaceId));

    const [deleted] = await tx
      .delete(workspacesTable)
      .where(eq(workspacesTable.id, workspaceId))
      .returning({ id: workspacesTable.id });
    return Boolean(deleted);
  });
}
