import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "../../config/db.connection.js";
import { invitationsTable } from "../../db/schema/invitations.schema.js";
import { usersTable } from "../../db/schema/users.schema.js";
import { workspaceMembersTable } from "../../db/schema/workspace-members.schema.js";
import { workspacesTable } from "../../db/schema/workspaces.schema.js";
import { logActivity } from "../activity-logs/activity.service.js";
import type { ActivityActor } from "../activity-logs/activity.types.js";

type WorkspaceRecord = typeof workspacesTable.$inferSelect;
type UserSummary = { id: string; name: string; email: string };
type InvitationPreviewRecord = {
  id: string;
  workspaceId: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "REVOKED";
  expiresAt: Date;
  createdAt: Date;
  acceptedAt: Date | null;
  workspaceName: string;
  workspaceSlug: string;
  inviterName: string;
};

export async function markExpiredPending(workspaceId?: string) {
  await db.update(invitationsTable).set({ status: "EXPIRED" }).where(and(
    eq(invitationsTable.status, "PENDING"), lt(invitationsTable.expiresAt, new Date()),
    ...(workspaceId ? [eq(invitationsTable.workspaceId, workspaceId)] : []),
  ));
}

export async function listForWorkspace(workspaceId: string) {
  await markExpiredPending(workspaceId);
  return db.select({
    id: invitationsTable.id, workspaceId: invitationsTable.workspaceId,
    email: invitationsTable.email, role: invitationsTable.role, status: invitationsTable.status,
    invitedBy: invitationsTable.invitedBy, invitedByName: usersTable.name,
    expiresAt: invitationsTable.expiresAt, acceptedAt: invitationsTable.acceptedAt,
    createdAt: invitationsTable.createdAt,
  }).from(invitationsTable)
    .innerJoin(usersTable, eq(usersTable.id, invitationsTable.invitedBy))
    .where(eq(invitationsTable.workspaceId, workspaceId))
    .orderBy(sql`${invitationsTable.createdAt} DESC`);
}

export async function findWorkspace(workspaceId: string): Promise<WorkspaceRecord | null> {
  const [row] = await db.select().from(workspacesTable).where(eq(workspacesTable.id, workspaceId)).limit(1);
  return row ?? null;
}

export async function findUserById(userId: string): Promise<UserSummary | null> {
  const [row] = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
    .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  return row ?? null;
}

export async function findUserByEmail(email: string): Promise<UserSummary | null> {
  const [row] = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
    .from(usersTable).where(sql`lower(${usersTable.email}) = ${email.toLowerCase()}`).limit(1);
  return row ?? null;
}

export async function findMembership(workspaceId: string, userId: string): Promise<{ id: string } | null> {
  const [row] = await db.select({ id: workspaceMembersTable.id }).from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, userId))).limit(1);
  return row ?? null;
}

export async function findPendingByEmail(workspaceId: string, email: string): Promise<{ id: string } | null> {
  await db.update(invitationsTable).set({ status: "EXPIRED" }).where(and(
    eq(invitationsTable.workspaceId, workspaceId), eq(invitationsTable.status, "PENDING"),
    sql`lower(${invitationsTable.email}) = ${email.toLowerCase()}`, lt(invitationsTable.expiresAt, new Date()),
  ));
  const [row] = await db.select({ id: invitationsTable.id }).from(invitationsTable).where(and(
    eq(invitationsTable.workspaceId, workspaceId), eq(invitationsTable.status, "PENDING"),
    sql`lower(${invitationsTable.email}) = ${email.toLowerCase()}`, gt(invitationsTable.expiresAt, new Date()),
  )).limit(1);
  return row ?? null;
}

export async function create(input: {
  workspaceId: string; invitedBy: string; email: string; role: "ADMIN" | "MEMBER";
  tokenHash: string; expiresAt: Date;
}, actor: ActivityActor) {
  const row = await db.transaction(async (tx) => {
    const [created] = await tx.insert(invitationsTable).values(input).returning();
    if (!created) return null;
    const [workspace] = await tx.select({ name: workspacesTable.name }).from(workspacesTable)
      .where(eq(workspacesTable.id, input.workspaceId)).limit(1);
    await logActivity(tx, {
      workspaceId: input.workspaceId,
      workspaceName: workspace?.name,
      actor,
      action: "INVITATION_CREATED",
      entityType: "INVITATION",
      entityId: created.id,
      entityName: created.email,
      metadata: { email: created.email, role: created.role },
    });
    return created;
  });
  return row;
}

export async function recordSent(input: {
  workspaceId: string; invitationId: string; email: string; role: "ADMIN" | "MEMBER";
  actor: ActivityActor;
  action?: "INVITATION_SENT" | "INVITATION_RESENT";
}) {
  return db.transaction(async (tx) => {
    const [workspace] = await tx.select({ name: workspacesTable.name }).from(workspacesTable)
      .where(eq(workspacesTable.id, input.workspaceId)).limit(1);
    await logActivity(tx, {
      workspaceId: input.workspaceId,
      workspaceName: workspace?.name,
      actor: input.actor,
      action: input.action ?? "INVITATION_SENT",
      entityType: "INVITATION",
      entityId: input.invitationId,
      entityName: input.email,
      metadata: { email: input.email, role: input.role },
    });
  });
}

export async function findById(workspaceId: string, invitationId: string): Promise<typeof invitationsTable.$inferSelect | null> {
  const [row] = await db.select().from(invitationsTable).where(and(
    eq(invitationsTable.workspaceId, workspaceId), eq(invitationsTable.id, invitationId),
  )).limit(1);
  return row ?? null;
}

export async function cancel(workspaceId: string, invitationId: string, actor?: ActivityActor): Promise<{ id: string } | null> {
  return db.transaction(async (tx) => {
    const [row] = await tx.update(invitationsTable).set({ status: "REVOKED" }).where(and(
      eq(invitationsTable.workspaceId, workspaceId), eq(invitationsTable.id, invitationId),
      eq(invitationsTable.status, "PENDING"), gt(invitationsTable.expiresAt, new Date()),
    )).returning({ id: invitationsTable.id, email: invitationsTable.email, role: invitationsTable.role });
    if (!row) return null;
    const [workspace] = await tx.select({ name: workspacesTable.name }).from(workspacesTable)
      .where(eq(workspacesTable.id, workspaceId)).limit(1);
    await logActivity(tx, {
      workspaceId,
      workspaceName: workspace?.name,
      actor: actor ?? null,
      action: "INVITATION_CANCELLED",
      entityType: "INVITATION",
      entityId: row.id,
      entityName: row.email,
      metadata: { email: row.email, role: row.role },
    });
    return { id: row.id };
  });
}

export async function rotateToken(invitationId: string, tokenHash: string, expiresAt: Date): Promise<typeof invitationsTable.$inferSelect | null> {
  const [row] = await db.update(invitationsTable).set({ tokenHash, expiresAt }).where(and(
    eq(invitationsTable.id, invitationId), eq(invitationsTable.status, "PENDING"),
    gt(invitationsTable.expiresAt, new Date()),
  )).returning();
  return row ?? null;
}

export async function revoke(invitationId: string) {
  await db.update(invitationsTable).set({ status: "REVOKED" }).where(and(
    eq(invitationsTable.id, invitationId), eq(invitationsTable.status, "PENDING"),
  ));
}

export async function findByTokenHash(tokenHash: string): Promise<InvitationPreviewRecord | null> {
  const [row] = await db.select({
    id: invitationsTable.id, workspaceId: invitationsTable.workspaceId, email: invitationsTable.email,
    role: invitationsTable.role, status: invitationsTable.status, expiresAt: invitationsTable.expiresAt,
    createdAt: invitationsTable.createdAt, acceptedAt: invitationsTable.acceptedAt,
    workspaceName: workspacesTable.name, workspaceSlug: workspacesTable.slug,
    inviterName: usersTable.name,
  }).from(invitationsTable)
    .innerJoin(workspacesTable, eq(workspacesTable.id, invitationsTable.workspaceId))
    .innerJoin(usersTable, eq(usersTable.id, invitationsTable.invitedBy))
    .where(eq(invitationsTable.tokenHash, tokenHash)).limit(1);
  return row ?? null;
}

export async function expire(invitationId: string) {
  await db.update(invitationsTable).set({ status: "EXPIRED" }).where(and(
    eq(invitationsTable.id, invitationId), eq(invitationsTable.status, "PENDING"),
  ));
}

export async function acceptAtomic(input: {
  invitationId: string;
  tokenHash: string;
  userId: string;
  workspaceId: string;
  role: "ADMIN" | "MEMBER";
  actorName?: string;
}) {
  return db.transaction(async (tx) => {
    const now = new Date();
    const [claimed] = await tx.update(invitationsTable).set({ status: "ACCEPTED", acceptedAt: now })
      .where(and(
        eq(invitationsTable.id, input.invitationId),
        eq(invitationsTable.tokenHash, input.tokenHash),
        eq(invitationsTable.status, "PENDING"),
        gt(invitationsTable.expiresAt, now),
      ))
      .returning({ id: invitationsTable.id, email: invitationsTable.email });
    if (!claimed) return false;
    await tx.insert(workspaceMembersTable).values({ workspaceId: input.workspaceId, userId: input.userId, role: input.role });
    const [workspace] = await tx.select({ name: workspacesTable.name }).from(workspacesTable)
      .where(eq(workspacesTable.id, input.workspaceId)).limit(1);
    const actor = { id: input.userId, name: input.actorName ?? "Workspace member" };
    await logActivity(tx, {
      workspaceId: input.workspaceId,
      workspaceName: workspace?.name,
      actor,
      action: "INVITATION_ACCEPTED",
      entityType: "INVITATION",
      entityId: input.invitationId,
      entityName: claimed.email,
      metadata: { role: input.role },
    });
    await logActivity(tx, {
      workspaceId: input.workspaceId,
      workspaceName: workspace?.name,
      actor,
      action: "MEMBER_ADDED",
      entityType: "MEMBER",
      entityId: input.userId,
      entityName: input.actorName ?? "Workspace member",
      metadata: { role: input.role, viaInvitationId: input.invitationId },
    });
    return true;
  });
}

export async function rejectAtomic(invitationId: string, tokenHash: string, actor?: ActivityActor): Promise<{ id: string } | null> {
  return db.transaction(async (tx) => {
    const [row] = await tx.update(invitationsTable).set({ status: "REJECTED" }).where(and(
      eq(invitationsTable.id, invitationId), eq(invitationsTable.tokenHash, tokenHash),
      eq(invitationsTable.status, "PENDING"), gt(invitationsTable.expiresAt, new Date()),
    )).returning({ id: invitationsTable.id, workspaceId: invitationsTable.workspaceId, email: invitationsTable.email, role: invitationsTable.role });
    if (!row) return null;
    const [workspace] = await tx.select({ name: workspacesTable.name }).from(workspacesTable)
      .where(eq(workspacesTable.id, row.workspaceId)).limit(1);
    await logActivity(tx, {
      workspaceId: row.workspaceId,
      workspaceName: workspace?.name,
      actor: actor ?? null,
      action: "INVITATION_REJECTED",
      entityType: "INVITATION",
      entityId: row.id,
      entityName: row.email,
      metadata: { email: row.email, role: row.role },
    });
    return { id: row.id };
  });
}
