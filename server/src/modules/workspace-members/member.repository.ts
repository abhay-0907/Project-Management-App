import { and, asc, eq } from "drizzle-orm";
import { db } from "../../config/db.connection.js";
import { tasksTable } from "../../db/schema/tasks.schema.js";
import { usersTable } from "../../db/schema/users.schema.js";
import { workspaceMembersTable } from "../../db/schema/workspace-members.schema.js";

export async function findWorkspaceMembers(workspaceId: string) {
  return db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      isActive: usersTable.isActive,
      role: workspaceMembersTable.role,
      joinedAt: workspaceMembersTable.joinedAt,
    })
    .from(workspaceMembersTable)
    .innerJoin(usersTable, eq(workspaceMembersTable.userId, usersTable.id))
    .where(eq(workspaceMembersTable.workspaceId, workspaceId))
    .orderBy(asc(usersTable.name));
}

export async function findWorkspaceMember(workspaceId: string, userId: string) {
  const [member] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      isActive: usersTable.isActive,
      role: workspaceMembersTable.role,
      joinedAt: workspaceMembersTable.joinedAt,
    })
    .from(workspaceMembersTable)
    .innerJoin(usersTable, eq(workspaceMembersTable.userId, usersTable.id))
    .where(
      and(
        eq(workspaceMembersTable.workspaceId, workspaceId),
        eq(workspaceMembersTable.userId, userId),
      ),
    )
    .limit(1);
  return member ?? null;
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  currentRole: "ADMIN" | "MEMBER",
  role: "ADMIN" | "MEMBER",
) {
  const [updated] = await db
    .update(workspaceMembersTable)
    .set({ role })
    .where(
      and(
        eq(workspaceMembersTable.workspaceId, workspaceId),
        eq(workspaceMembersTable.userId, userId),
        eq(workspaceMembersTable.role, currentRole),
      ),
    )
    .returning({ userId: workspaceMembersTable.userId });
  return updated ? findWorkspaceMember(workspaceId, userId) : null;
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
  currentRole: "ADMIN" | "MEMBER",
) {
  const membershipChanged = new Error("Workspace membership changed during removal");
  try {
    return await db.transaction(async (tx) => {
      const [membership] = await tx
        .select({ role: workspaceMembersTable.role })
        .from(workspaceMembersTable)
        .where(
          and(
            eq(workspaceMembersTable.workspaceId, workspaceId),
            eq(workspaceMembersTable.userId, userId),
          ),
        )
        .limit(1);

      if (!membership || membership.role !== currentRole) return false;

      // Keep tasks and creator history while clearing the membership-bound assignment.
      await tx
        .update(tasksTable)
        .set({ assigneeId: null, updatedAt: new Date() })
        .where(
          and(
            eq(tasksTable.workspaceId, workspaceId),
            eq(tasksTable.assigneeId, userId),
          ),
        );

      const [removed] = await tx
        .delete(workspaceMembersTable)
        .where(
          and(
            eq(workspaceMembersTable.workspaceId, workspaceId),
            eq(workspaceMembersTable.userId, userId),
            eq(workspaceMembersTable.role, currentRole),
          ),
        )
        .returning({ userId: workspaceMembersTable.userId });

      if (!removed) throw membershipChanged;
      return true;
    });
  } catch (error) {
    if (error === membershipChanged) return false;
    throw error;
  }
}
