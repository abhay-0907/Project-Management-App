import { and, asc, eq } from "drizzle-orm";
import { db } from "../../config/db.connection.js";
import { tasksTable } from "../../db/schema/tasks.schema.js";
import { usersTable } from "../../db/schema/users.schema.js";
import { workspaceMembersTable } from "../../db/schema/workspace-members.schema.js";
import { workspacesTable } from "../../db/schema/workspaces.schema.js";
import { logActivity } from "../activity-logs/activity.service.js";
import type { ActivityActor } from "../activity-logs/activity.types.js";

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
  actor: ActivityActor,
) {
  return db.transaction(async (tx) => {
    const [target] = await tx.select({ name: usersTable.name })
      .from(workspaceMembersTable)
      .innerJoin(usersTable, eq(usersTable.id, workspaceMembersTable.userId))
      .where(and(
        eq(workspaceMembersTable.workspaceId, workspaceId),
        eq(workspaceMembersTable.userId, userId),
        eq(workspaceMembersTable.role, currentRole),
      )).limit(1);
    if (!target) return null;

    const [updated] = await tx.update(workspaceMembersTable).set({ role }).where(and(
      eq(workspaceMembersTable.workspaceId, workspaceId),
      eq(workspaceMembersTable.userId, userId),
      eq(workspaceMembersTable.role, currentRole),
    )).returning();
    if (!updated) return null;

    const [workspace] = await tx.select({ name: workspacesTable.name })
      .from(workspacesTable).where(eq(workspacesTable.id, workspaceId)).limit(1);
    await logActivity(tx, {
      workspaceId,
      workspaceName: workspace?.name,
      actor,
      action: "MEMBER_ROLE_CHANGED",
      entityType: "MEMBER",
      entityId: userId,
      entityName: target.name,
      metadata: { oldRole: currentRole, newRole: role },
    });

    const [member] = await tx.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      isActive: usersTable.isActive,
      role: workspaceMembersTable.role,
      joinedAt: workspaceMembersTable.joinedAt,
    }).from(workspaceMembersTable)
      .innerJoin(usersTable, eq(workspaceMembersTable.userId, usersTable.id))
      .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, userId)))
      .limit(1);
    return member ?? null;
  });
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
  currentRole: "ADMIN" | "MEMBER",
  actor: ActivityActor,
) {
  const membershipChanged = new Error(
    "Workspace membership changed during removal",
  );
  try {
    return await db.transaction(async (tx) => {
      const [membership] = await tx
        .select({ role: workspaceMembersTable.role, name: usersTable.name })
        .from(workspaceMembersTable)
        .innerJoin(usersTable, eq(usersTable.id, workspaceMembersTable.userId))
        .where(
          and(
            eq(workspaceMembersTable.workspaceId, workspaceId),
            eq(workspaceMembersTable.userId, userId),
          ),
        )
        .limit(1);

      if (!membership || membership.role !== currentRole) return false;

      const assignedTasks = await tx.select({ id: tasksTable.id, title: tasksTable.title, projectId: tasksTable.projectId })
        .from(tasksTable)
        .where(and(
          eq(tasksTable.workspaceId, workspaceId),
          eq(tasksTable.assigneeId, userId),
        )).for("update");

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

      const [workspace] = await tx.select({ name: workspacesTable.name })
        .from(workspacesTable).where(eq(workspacesTable.id, workspaceId)).limit(1);
      for (const task of assignedTasks) {
        await logActivity(tx, {
          workspaceId,
          workspaceName: workspace?.name,
          actor,
          action: "TASK_ASSIGNEE_CHANGED",
          entityType: "TASK",
          entityId: task.id,
          entityName: task.title,
          metadata: {
            projectId: task.projectId,
            changes: { assignee: { old: { id: userId, name: membership.name }, new: null } },
            reason: "MEMBER_REMOVED",
          },
        });
      }
      await logActivity(tx, {
        workspaceId,
        workspaceName: workspace?.name,
        actor,
        action: "MEMBER_REMOVED",
        entityType: "MEMBER",
        entityId: userId,
        entityName: membership.name,
        metadata: { role: currentRole, affectedTaskCount: assignedTasks.length },
      });
      return true;
    });
  } catch (error) {
    if (error === membershipChanged) return false;
    throw error;
  }
}
