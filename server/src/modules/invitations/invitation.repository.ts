import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "../../config/db.connection.js";
import { invitationsTable } from "../../db/schema/invitations.schema.js";
import { usersTable } from "../../db/schema/users.schema.js";
import { workspaceMembersTable } from "../../db/schema/workspace-members.schema.js";
import { workspacesTable } from "../../db/schema/workspaces.schema.js";

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
}) {
  const [row] = await db.transaction(async (tx) => {
    const [created] = await tx.insert(invitationsTable).values(input).returning();
    return [created];
  });
  return row;
}

export async function findById(workspaceId: string, invitationId: string): Promise<typeof invitationsTable.$inferSelect | null> {
  const [row] = await db.select().from(invitationsTable).where(and(
    eq(invitationsTable.workspaceId, workspaceId), eq(invitationsTable.id, invitationId),
  )).limit(1);
  return row ?? null;
}

export async function cancel(workspaceId: string, invitationId: string): Promise<{ id: string } | null> {
  const [row] = await db.update(invitationsTable).set({ status: "REVOKED" }).where(and(
    eq(invitationsTable.workspaceId, workspaceId), eq(invitationsTable.id, invitationId),
    eq(invitationsTable.status, "PENDING"), gt(invitationsTable.expiresAt, new Date()),
  )).returning({ id: invitationsTable.id });
  return row ?? null;
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
      .returning({ id: invitationsTable.id });
    if (!claimed) return false;
    await tx.insert(workspaceMembersTable).values({ workspaceId: input.workspaceId, userId: input.userId, role: input.role });
    return true;
  });
}

export async function rejectAtomic(invitationId: string, tokenHash: string): Promise<{ id: string } | null> {
  const [row] = await db.update(invitationsTable).set({ status: "REJECTED" }).where(and(
    eq(invitationsTable.id, invitationId), eq(invitationsTable.tokenHash, tokenHash),
    eq(invitationsTable.status, "PENDING"), gt(invitationsTable.expiresAt, new Date()),
  )).returning({ id: invitationsTable.id });
  return row ?? null;
}
