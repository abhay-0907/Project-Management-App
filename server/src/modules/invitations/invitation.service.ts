import { createHash, randomBytes } from "node:crypto";
import * as repository from "./invitation.repository.js";
import { sendWorkspaceInvitationEmail } from "./invitation.email.js";
import type { WorkspaceRole } from "../workspaces/workspace.types.js";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type InvitationRepository = Pick<typeof repository,
  | "listForWorkspace" | "findWorkspace" | "findUserById" | "findUserByEmail"
  | "findMembership" | "findPendingByEmail" | "create" | "findById"
  | "cancel" | "rotateToken" | "revoke" | "findByTokenHash" | "expire"
  | "acceptAtomic" | "rejectAtomic"
>;

export type InvitationDependencies = {
  repository: InvitationRepository;
  sendEmail: typeof sendWorkspaceInvitationEmail;
};

export class InvitationError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "InvitationError";
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createToken() {
  return randomBytes(32).toString("base64url");
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export function createInvitationService(dependencies: InvitationDependencies = {
  repository,
  sendEmail: sendWorkspaceInvitationEmail,
}) {
const repo = dependencies.repository;
const sendEmail = dependencies.sendEmail;

async function listInvitations(workspaceId: string) {
  return repo.listForWorkspace(workspaceId);
}

async function createInvitation(
  workspaceId: string,
  actor: { id: string; name: string },
  actorRole: WorkspaceRole,
  input: { email: string; role: "ADMIN" | "MEMBER" },
) {
  if (actorRole !== "OWNER" && actorRole !== "ADMIN") throw new InvitationError(403, "You cannot invite workspace members");
  if (actorRole === "ADMIN" && input.role !== "MEMBER") throw new InvitationError(403, "Admins can invite members only");
  const email = input.email.trim().toLowerCase();

  const [workspace, user] = await Promise.all([
    repo.findWorkspace(workspaceId), repo.findUserByEmail(email),
  ]);
  if (!workspace) throw new InvitationError(404, "Workspace not found");
  if (user && await repo.findMembership(workspaceId, user.id)) {
    throw new InvitationError(409, "This person is already a workspace member");
  }
  if (await repo.findPendingByEmail(workspaceId, email)) {
    throw new InvitationError(409, "A pending invitation already exists for this email");
  }

  const token = createToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
  let invitation;
  try {
    invitation = await repo.create({
      workspaceId, invitedBy: actor.id, email, role: input.role,
      tokenHash: hashToken(token), expiresAt,
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new InvitationError(409, "A pending invitation already exists for this email");
    throw error;
  }
  if (!invitation) throw new Error("Invitation creation failed");

  try {
    await sendEmail({
      to: email, workspaceName: workspace.name, inviterName: actor.name,
      role: input.role, token, expiresAt,
    });
  } catch {
    await repo.revoke(invitation.id);
    throw new InvitationError(503, "The invitation email could not be delivered, so the invitation was cancelled. Please try again.");
  }
  return { id: invitation.id, email: invitation.email, role: invitation.role, status: invitation.status, expiresAt: invitation.expiresAt, createdAt: invitation.createdAt };
}

async function cancelInvitation(workspaceId: string, invitationId: string, actorRole: WorkspaceRole) {
  const invitation = await repo.findById(workspaceId, invitationId);
  if (!invitation) throw new InvitationError(404, "Invitation not found");
  if (invitation.status !== "PENDING") throw new InvitationError(409, "Only pending invitations can be cancelled");
  if (actorRole === "ADMIN" && invitation.role === "ADMIN") {
    throw new InvitationError(403, "Admins cannot cancel administrator invitations");
  }
  if (invitation.expiresAt <= new Date()) {
    await repo.expire(invitation.id);
    throw new InvitationError(410, "This invitation has expired");
  }
  if (!await repo.cancel(workspaceId, invitationId)) throw new InvitationError(409, "Invitation changed; refresh and try again");
}

async function resendInvitation(workspaceId: string, invitationId: string, actor: { name: string }, actorRole: WorkspaceRole) {
  const invitation = await repo.findById(workspaceId, invitationId);
  if (!invitation) throw new InvitationError(404, "Invitation not found");
  if (invitation.status !== "PENDING") throw new InvitationError(409, "Only pending invitations can be resent");
  if (actorRole === "ADMIN" && invitation.role === "ADMIN") {
    throw new InvitationError(403, "Admins cannot resend administrator invitations");
  }
  if (invitation.expiresAt <= new Date()) {
    await repo.expire(invitation.id);
    throw new InvitationError(410, "This invitation has expired; create a new invitation");
  }
  const [workspace, inviter] = await Promise.all([
    repo.findWorkspace(workspaceId), repo.findUserById(invitation.invitedBy),
  ]);
  if (!workspace || !inviter) throw new InvitationError(404, "Invitation details are unavailable");
  const token = createToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
  const updated = await repo.rotateToken(invitationId, hashToken(token), expiresAt);
  if (!updated) throw new InvitationError(409, "Invitation changed; refresh and try again");
  try {
    await sendEmail({
      to: updated.email, workspaceName: workspace.name, inviterName: actor.name || inviter.name,
      role: updated.role, token, expiresAt,
    });
  } catch {
    await repo.revoke(invitationId);
    throw new InvitationError(503, "The invitation email could not be delivered, so the invitation was cancelled");
  }
  return { message: "Invitation resent", expiresAt };
}

async function previewInvitation(token: string) {
  const invitation = await repo.findByTokenHash(hashToken(token));
  if (!invitation) throw new InvitationError(404, "Invitation not found");
  if (invitation.status === "PENDING" && invitation.expiresAt <= new Date()) {
    await repo.expire(invitation.id);
    invitation.status = "EXPIRED";
  }
  return {
    workspaceName: invitation.workspaceName, workspaceSlug: invitation.workspaceSlug,
    email: invitation.email, role: invitation.role, status: invitation.status,
    inviterName: invitation.inviterName, expiresAt: invitation.expiresAt,
  };
}

async function acceptInvitation(token: string, user: { id: string; email: string; emailVerifiedAt: Date | null }) {
  if (!user.emailVerifiedAt) throw new InvitationError(403, "A verified email address is required to accept invitations");
  const invitation = await repo.findByTokenHash(hashToken(token));
  if (!invitation) throw new InvitationError(404, "Invitation not found");
  if (invitation.status !== "PENDING") throw new InvitationError(invitation.status === "EXPIRED" ? 410 : 409, "This invitation is no longer pending");
  if (invitation.expiresAt <= new Date()) {
    await repo.expire(invitation.id);
    throw new InvitationError(410, "This invitation has expired");
  }
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new InvitationError(403, "Sign in with the email address this invitation was sent to");
  }
  if (await repo.findMembership(invitation.workspaceId, user.id)) {
    throw new InvitationError(409, "You are already a member of this workspace");
  }
  try {
    const accepted = await repo.acceptAtomic({
      invitationId: invitation.id, tokenHash: hashToken(token),
      workspaceId: invitation.workspaceId, userId: user.id, role: invitation.role,
    });
    if (!accepted) throw new InvitationError(409, "This invitation was already used or expired");
  } catch (error) {
    if (isUniqueViolation(error)) throw new InvitationError(409, "You are already a member of this workspace");
    throw error;
  }
  return { workspaceId: invitation.workspaceId, workspaceSlug: invitation.workspaceSlug, message: "Invitation accepted" };
}

async function rejectInvitation(token: string, user: { email: string; emailVerifiedAt: Date | null }) {
  if (!user.emailVerifiedAt) throw new InvitationError(403, "A verified email address is required to reject invitations");
  const invitation = await repo.findByTokenHash(hashToken(token));
  if (!invitation) throw new InvitationError(404, "Invitation not found");
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new InvitationError(403, "Sign in with the email address this invitation was sent to");
  }
  if (invitation.status !== "PENDING") throw new InvitationError(invitation.status === "EXPIRED" ? 410 : 409, "This invitation is no longer pending");
  if (invitation.expiresAt <= new Date()) {
    await repo.expire(invitation.id);
    throw new InvitationError(410, "This invitation has expired");
  }
  if (!await repo.rejectAtomic(invitation.id, hashToken(token))) throw new InvitationError(409, "This invitation was already used or expired");
  return { message: "Invitation declined" };
}

return {
  listInvitations, createInvitation, cancelInvitation, resendInvitation,
  previewInvitation, acceptInvitation, rejectInvitation,
};
}

const invitationService = createInvitationService();
export const {
  listInvitations, createInvitation, cancelInvitation, resendInvitation,
  previewInvitation, acceptInvitation, rejectInvitation,
} = invitationService;
