import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import type { Invitation } from "../../db/schema/invitations.schema.js";
import { createInvitationService, InvitationError, type InvitationDependencies } from "./invitation.service.js";

const WORKSPACE_ID = randomUUID();
const OWNER_ID = randomUUID();
const USER_ID = randomUUID();
const NOW = new Date("2026-11-23T12:00:00.000Z");
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

function makeHarness(options: {
  sendEmail?: InvitationDependencies["sendEmail"];
  beforeMembershipLookup?: () => void;
} = {}) {
  const invitations: Invitation[] = [];
  const members = new Map<string, "OWNER" | "ADMIN" | "MEMBER">([[`${WORKSPACE_ID}:${OWNER_ID}`, "OWNER"]]);
  const emails: Array<{ to: string; token: string; role: "ADMIN" | "MEMBER"; expiresAt: Date }> = [];
  let existingUser: { id: string; name: string; email: string } | null = null;
  const repository: InvitationDependencies["repository"] = {
    async listForWorkspace(workspaceId) {
      return invitations.filter((item) => item.workspaceId === workspaceId).map((item) => ({
        ...item, invitedByName: "Owner",
      }));
    },
    async findWorkspace(workspaceId) {
      return workspaceId === WORKSPACE_ID ? {
        id: WORKSPACE_ID, name: "Nexora", slug: "nexora", createdBy: OWNER_ID,
        createdAt: NOW, updatedAt: NOW,
      } : null;
    },
    async findUserById(userId) {
      return userId === OWNER_ID ? { id: OWNER_ID, name: "Owner", email: "owner@example.com" } : null;
    },
    async findUserByEmail(email) {
      return existingUser?.email.toLowerCase() === email.toLowerCase() ? existingUser : null;
    },
    async findMembership(workspaceId, userId) {
      options.beforeMembershipLookup?.();
      return members.has(`${workspaceId}:${userId}`) ? { id: randomUUID() } : null;
    },
    async findPendingByEmail(workspaceId, email) {
      const now = new Date();
      for (const invitation of invitations) {
        if (invitation.workspaceId === workspaceId && invitation.email.toLowerCase() === email.toLowerCase() &&
            invitation.status === "PENDING" && invitation.expiresAt <= now) invitation.status = "EXPIRED";
      }
      return invitations.find((item) => item.workspaceId === workspaceId && item.email.toLowerCase() === email.toLowerCase() && item.status === "PENDING" && item.expiresAt > now)
        ? { id: randomUUID() } : null;
    },
    async create(input) {
      const invitation: Invitation = {
        id: randomUUID(), ...input, status: "PENDING", acceptedAt: null, createdAt: new Date(),
      };
      invitations.push(invitation);
      return invitation;
    },
    async findById(workspaceId, invitationId) {
      return invitations.find((item) => item.workspaceId === workspaceId && item.id === invitationId) ?? null;
    },
    async cancel(workspaceId, invitationId) {
      const invitation = invitations.find((item) => item.workspaceId === workspaceId && item.id === invitationId && item.status === "PENDING" && item.expiresAt > new Date());
      if (!invitation) return null;
      invitation.status = "REVOKED";
      return { id: invitation.id };
    },
    async rotateToken(invitationId, tokenHash, expiresAt) {
      const invitation = invitations.find((item) => item.id === invitationId && item.status === "PENDING" && item.expiresAt > new Date());
      if (!invitation) return null;
      invitation.tokenHash = tokenHash;
      invitation.expiresAt = expiresAt;
      return invitation;
    },
    async revoke(invitationId) {
      const invitation = invitations.find((item) => item.id === invitationId && item.status === "PENDING");
      if (invitation) invitation.status = "REVOKED";
    },
    async findByTokenHash(tokenHash) {
      const invitation = invitations.find((item) => item.tokenHash === tokenHash);
      if (!invitation) return null;
      return {
        id: invitation.id, workspaceId: invitation.workspaceId, email: invitation.email,
        role: invitation.role, status: invitation.status, expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt, acceptedAt: invitation.acceptedAt,
        workspaceName: "Nexora", workspaceSlug: "nexora", inviterName: "Owner",
      };
    },
    async expire(invitationId) {
      const invitation = invitations.find((item) => item.id === invitationId && item.status === "PENDING");
      if (invitation) invitation.status = "EXPIRED";
    },
    async acceptAtomic(input) {
      const invitation = invitations.find((item) => item.id === input.invitationId && item.tokenHash === input.tokenHash && item.status === "PENDING" && item.expiresAt > new Date());
      if (!invitation || members.has(`${input.workspaceId}:${input.userId}`)) return false;
      invitation.status = "ACCEPTED";
      invitation.acceptedAt = new Date();
      members.set(`${input.workspaceId}:${input.userId}`, input.role);
      return true;
    },
    async rejectAtomic(invitationId, tokenHash) {
      const invitation = invitations.find((item) => item.id === invitationId && item.tokenHash === tokenHash && item.status === "PENDING" && item.expiresAt > new Date());
      if (!invitation) return null;
      invitation.status = "REJECTED";
      return { id: invitation.id };
    },
  };
  const service = createInvitationService({
    repository,
    sendEmail: options.sendEmail ?? (async (message) => {
      emails.push({ to: message.to, token: message.token, role: message.role, expiresAt: message.expiresAt });
    }),
  });

  return {
    service, invitations, members, emails,
    setExistingUser(value: typeof existingUser) { existingUser = value; },
    async create(email = "new@example.com", role: "ADMIN" | "MEMBER" = "MEMBER") {
      await service.createInvitation(WORKSPACE_ID, { id: OWNER_ID, name: "Owner" }, "OWNER", { email, role });
      return emails.at(-1)!.token;
    },
  };
}

function verifiedUser(email: string, id = USER_ID) {
  return { id, email, emailVerifiedAt: NOW };
}

async function expectInvitationError(action: Promise<unknown>, status: number) {
  await assert.rejects(action, (error: unknown) => error instanceof InvitationError && error.status === status);
}

test("invites an email with no account without creating membership", async () => {
  const harness = makeHarness();
  const result = await harness.service.createInvitation(
    WORKSPACE_ID, { id: OWNER_ID, name: "Owner" }, "OWNER", { email: "Person@Example.com", role: "MEMBER" },
  );
  const token = harness.emails[0]!.token;
  assert.equal(harness.invitations[0]?.email, "person@example.com");
  assert.equal(harness.invitations[0]?.tokenHash, hash(token));
  assert.notEqual(harness.invitations[0]?.tokenHash, token);
  assert.equal("tokenHash" in result, false);
  assert.equal("token" in result, false);
  assert.equal(harness.members.has(`${WORKSPACE_ID}:${USER_ID}`), false);
});

test("invites an existing account without auto-joining it", async () => {
  const harness = makeHarness();
  harness.setExistingUser({ id: USER_ID, name: "Person", email: "person@example.com" });
  await harness.create("person@example.com");
  assert.equal(harness.invitations.length, 1);
  assert.equal(harness.members.has(`${WORKSPACE_ID}:${USER_ID}`), false);
});

test("a registered account does not join until it explicitly accepts", async () => {
  const harness = makeHarness();
  const token = await harness.create("new@example.com");
  harness.setExistingUser({ id: USER_ID, name: "Person", email: "new@example.com" });
  assert.equal(harness.invitations[0]?.status, "PENDING");
  assert.equal(harness.members.has(`${WORKSPACE_ID}:${USER_ID}`), false);
  assert.equal(harness.emails[0]?.token, token);
});

test("blocks acceptance unless the authenticated account has a verified email", async () => {
  const harness = makeHarness();
  const token = await harness.create();
  await expectInvitationError(harness.service.acceptInvitation(token, { id: USER_ID, email: "new@example.com", emailVerifiedAt: null }), 403);
  assert.equal(harness.invitations[0]?.status, "PENDING");
});

test("rejects acceptance when the verified account email does not match", async () => {
  const harness = makeHarness();
  const token = await harness.create();
  await expectInvitationError(harness.service.acceptInvitation(token, verifiedUser("other@example.com")), 403);
  assert.equal(harness.invitations[0]?.status, "PENDING");
});

test("rejects an invalid token", async () => {
  const harness = makeHarness();
  await expectInvitationError(harness.service.previewInvitation("x".repeat(43)), 404);
});

test("expires a pending invitation before rejecting acceptance", async () => {
  const harness = makeHarness();
  const token = await harness.create();
  harness.invitations[0]!.expiresAt = new Date(Date.now() - 1);
  await expectInvitationError(harness.service.acceptInvitation(token, verifiedUser("new@example.com")), 410);
  assert.equal(harness.invitations[0]?.status, "EXPIRED");
});

test("prevents reuse after acceptance and records acceptedAt", async () => {
  const harness = makeHarness();
  const token = await harness.create();
  await harness.service.acceptInvitation(token, verifiedUser("new@example.com"));
  assert.equal(harness.invitations[0]?.status, "ACCEPTED");
  assert.ok(harness.invitations[0]?.acceptedAt);
  await expectInvitationError(harness.service.acceptInvitation(token, verifiedUser("new@example.com")), 409);
});

test("does not accept a rejected invitation", async () => {
  const harness = makeHarness();
  const token = await harness.create();
  await harness.service.rejectInvitation(token, { email: "new@example.com", emailVerifiedAt: NOW });
  await expectInvitationError(harness.service.acceptInvitation(token, verifiedUser("new@example.com")), 409);
});

test("does not accept a cancelled invitation (stored as legacy REVOKED)", async () => {
  const harness = makeHarness();
  const token = await harness.create();
  await harness.service.cancelInvitation(WORKSPACE_ID, harness.invitations[0]!.id, "OWNER");
  await expectInvitationError(harness.service.acceptInvitation(token, verifiedUser("new@example.com")), 409);
});

test("rejects acceptance by a user who is already a workspace member", async () => {
  const harness = makeHarness();
  const token = await harness.create();
  harness.members.set(`${WORKSPACE_ID}:${USER_ID}`, "MEMBER");
  await expectInvitationError(harness.service.acceptInvitation(token, verifiedUser("new@example.com")), 409);
  assert.equal(harness.invitations[0]?.status, "PENDING");
});

test("allows only one of two concurrent accept attempts to succeed", async () => {
  const harness = makeHarness();
  const token = await harness.create();
  const results = await Promise.allSettled([
    harness.service.acceptInvitation(token, verifiedUser("new@example.com")),
    harness.service.acceptInvitation(token, verifiedUser("new@example.com")),
  ]);
  assert.equal(results.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(results.filter((item) => item.status === "rejected").length, 1);
  assert.equal(harness.invitations[0]?.status, "ACCEPTED");
  assert.equal(harness.members.get(`${WORKSPACE_ID}:${USER_ID}`), "MEMBER");
});

test("a resend that races acceptance invalidates the old token", async () => {
  let tokenHashToUse: string | undefined;
  const harness = makeHarness({ beforeMembershipLookup: () => {
    if (tokenHashToUse) {
      harness.invitations[0]!.tokenHash = tokenHashToUse;
      tokenHashToUse = undefined;
    }
  } });
  const oldToken = await harness.create();
  tokenHashToUse = hash("new-resend-token");
  await expectInvitationError(harness.service.acceptInvitation(oldToken, verifiedUser("new@example.com")), 409);
  assert.equal(harness.invitations[0]?.status, "PENDING");
  assert.equal(harness.members.has(`${WORKSPACE_ID}:${USER_ID}`), false);
});

test("resends with a new token and preserves the assigned role", async () => {
  const harness = makeHarness();
  const originalToken = await harness.create("new@example.com", "ADMIN");
  const invitation = harness.invitations[0]!;
  await harness.service.resendInvitation(WORKSPACE_ID, invitation.id, { name: "Owner" }, "OWNER");
  assert.equal(harness.emails.length, 2);
  assert.notEqual(invitation.tokenHash, hash(originalToken));
  assert.equal(harness.emails[1]?.role, "ADMIN");
  await harness.service.acceptInvitation(harness.emails[1]!.token, verifiedUser("new@example.com"));
  assert.equal(harness.members.get(`${WORKSPACE_ID}:${USER_ID}`), "ADMIN");
});

test("cancels an invitation when email delivery fails", async () => {
  const harness = makeHarness({ sendEmail: async () => { throw new Error("SMTP unavailable"); } });
  await expectInvitationError(harness.service.createInvitation(
    WORKSPACE_ID, { id: OWNER_ID, name: "Owner" }, "OWNER", { email: "new@example.com", role: "MEMBER" },
  ), 503);
  assert.equal(harness.invitations[0]?.status, "REVOKED");
  assert.equal(harness.members.has(`${WORKSPACE_ID}:${USER_ID}`), false);
});

test("requires the originally assigned role to be used on acceptance", async () => {
  const harness = makeHarness();
  const token = await harness.create("new@example.com", "ADMIN");
  await harness.service.acceptInvitation(token, verifiedUser("new@example.com"));
  assert.equal(harness.members.get(`${WORKSPACE_ID}:${USER_ID}`), "ADMIN");
});
