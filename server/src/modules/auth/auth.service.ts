import argon2 from "argon2";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import { db } from "../../config/db.connection.js";
import { emailVerificationTokensTable } from "../../db/schema/email-verification-tokens.schema.js";
import { passwordResetTokensTable } from "../../db/schema/password-reset-tokens.schema.js";
import { sessionsTable } from "../../db/schema/sessions.schema.js";
import { usersTable } from "../../db/schema/users.schema.js";
import { sendPasswordResetCode, sendVerificationCode } from "./auth.email.js";
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyPasswordResetOtpInput,
  VerifyEmailInput,
} from "./auth.validation.js";
import { toPublicUser } from "./auth.type.js";

const VERIFICATION_TTL_MS = 5 * 60 * 1000;
const VERIFICATION_MAX_ATTEMPTS = 5;
const VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 5 * 60 * 1000;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;
const PASSWORD_RESET_RESEND_COOLDOWN_MS = 60 * 1000;

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");

function createVerificationCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function digestVerificationCode(userId: string, otp: string) {
  // DATABASE_URL is already required by the server; allow a dedicated key to be configured too.
  const key = process.env.OTP_HASH_SECRET ?? process.env.DATABASE_URL;
  if (!key) throw new Error("OTP_HASH_SECRET or DATABASE_URL must be configured");
  return createHmac("sha256", key).update(`${userId}:${otp}`).digest("hex");
}

function digestPasswordResetCode(userId: string, otp: string) {
  const key = process.env.OTP_HASH_SECRET ?? process.env.DATABASE_URL;
  if (!key) throw new Error("OTP_HASH_SECRET or DATABASE_URL must be configured");
  return createHmac("sha256", key)
    .update(`password-reset:${userId}:${otp}`)
    .digest("hex");
}

export async function register(input: RegisterInput) {
  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });
  const otp = createVerificationCode();
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

  let user;
  try {
    [user] = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(usersTable)
        .values({
          name: input.name,
          email: input.email,
          passwordHash,
        })
        .returning();
      if (!created) throw new Error("User creation failed");
      await tx.insert(emailVerificationTokensTable).values({
        userId: created.id,
        email: created.email,
        codeHash: digestVerificationCode(created.id, otp),
        expiresAt,
      });
      return [created];
    });
  } catch (error) {
    if (isUniqueViolation(error))
      throw new AuthError(409, "An account with this email already exists");
    throw error;
  }

  try {
    await sendVerificationCode(user.email, user.name, otp);
  } catch (error) {
    // Do not leave an account stranded if delivery fails; remove both rows so registration can be retried.
    await db.delete(usersTable).where(eq(usersTable.id, user.id));
    throw new AuthError(
      503,
      error instanceof Error
        ? error.message
        : "Verification email could not be sent",
    );
  }
  return {
    user: toPublicUser(user),
    message: "Account created. Enter the verification code sent to your email within 5 minutes.",
  };
}

export async function verifyEmail(input: VerifyEmailInput) {
  const now = new Date();
  const result = await db.transaction(async (tx) => {
    const [existingUser] = await tx
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1);
    if (!existingUser || existingUser.emailVerifiedAt) return null;

    const [verification] = await tx
      .select()
      .from(emailVerificationTokensTable)
      .where(
        and(
          eq(emailVerificationTokensTable.userId, existingUser.id),
          eq(emailVerificationTokensTable.email, input.email),
          isNull(emailVerificationTokensTable.usedAt),
          gt(emailVerificationTokensTable.expiresAt, now),
          lt(emailVerificationTokensTable.attempts, VERIFICATION_MAX_ATTEMPTS),
        ),
      )
      .orderBy(desc(emailVerificationTokensTable.createdAt))
      .limit(1);
    if (!verification) return null;

    const expectedHash = Buffer.from(verification.codeHash, "hex");
    const submittedHash = Buffer.from(digestVerificationCode(existingUser.id, input.otp), "hex");
    if (!timingSafeEqual(expectedHash, submittedHash)) {
      const [attempt] = await tx
        .update(emailVerificationTokensTable)
        .set({ attempts: sql`${emailVerificationTokensTable.attempts} + 1` })
        .where(
          and(
            eq(emailVerificationTokensTable.id, verification.id),
            isNull(emailVerificationTokensTable.usedAt),
            gt(emailVerificationTokensTable.expiresAt, now),
            lt(emailVerificationTokensTable.attempts, VERIFICATION_MAX_ATTEMPTS),
          ),
        )
        .returning({ attempts: emailVerificationTokensTable.attempts });
      if (attempt && attempt.attempts >= VERIFICATION_MAX_ATTEMPTS) {
        await tx
          .update(emailVerificationTokensTable)
          .set({ usedAt: now })
          .where(
            and(
              eq(emailVerificationTokensTable.id, verification.id),
              isNull(emailVerificationTokensTable.usedAt),
            ),
          );
      }
      return null;
    }

    const [consumed] = await tx
      .update(emailVerificationTokensTable)
      .set({ usedAt: now })
      .where(
        and(
          eq(emailVerificationTokensTable.id, verification.id),
          isNull(emailVerificationTokensTable.usedAt),
          gt(emailVerificationTokensTable.expiresAt, now),
          lt(emailVerificationTokensTable.attempts, VERIFICATION_MAX_ATTEMPTS),
        ),
      )
      .returning({ id: emailVerificationTokensTable.id });
    if (!consumed) return null;

    const [verifiedUser] = await tx
      .update(usersTable)
      .set({ emailVerifiedAt: now, updatedAt: now })
      .where(
        and(
          eq(usersTable.id, verification.userId),
          eq(usersTable.email, verification.email),
          isNull(usersTable.emailVerifiedAt),
        ),
      )
      .returning();
    if (!verifiedUser) return null;
    return verifiedUser;
  });
  if (!result)
    throw new AuthError(400, "Verification code is invalid, expired, or locked");
  return {
    user: toPublicUser(result),
    message: "Email verified successfully",
  };
}

export async function resendVerificationCode(email: string) {
  const now = new Date();
  const pending = await db.transaction(async (tx) => {
    const [user] = await tx
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (!user || user.emailVerifiedAt) return null;

    const [latest] = await tx
      .select({ createdAt: emailVerificationTokensTable.createdAt })
      .from(emailVerificationTokensTable)
      .where(eq(emailVerificationTokensTable.userId, user.id))
      .orderBy(desc(emailVerificationTokensTable.createdAt))
      .limit(1);
    if (
      latest &&
      now.getTime() - latest.createdAt.getTime() < VERIFICATION_RESEND_COOLDOWN_MS
    ) return null;

    await tx
      .update(emailVerificationTokensTable)
      .set({ usedAt: now })
      .where(
        and(
          eq(emailVerificationTokensTable.userId, user.id),
          isNull(emailVerificationTokensTable.usedAt),
        ),
      );

    const otp = createVerificationCode();
    const expiresAt = new Date(now.getTime() + VERIFICATION_TTL_MS);
    const [challenge] = await tx
      .insert(emailVerificationTokensTable)
      .values({
        userId: user.id,
        email: user.email,
        codeHash: digestVerificationCode(user.id, otp),
        expiresAt,
      })
      .returning({ id: emailVerificationTokensTable.id });
    if (!challenge) throw new Error("Verification code creation failed");
    return { user, otp, challengeId: challenge.id };
  });

  const response = {
    message: "If the account is awaiting verification, a code has been sent.",
  };
  if (!pending) return response;

  try {
    await sendVerificationCode(pending.user.email, pending.user.name, pending.otp);
  } catch (error) {
    await db
      .update(emailVerificationTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokensTable.id, pending.challengeId));
    throw new AuthError(
      503,
      error instanceof Error ? error.message : "Verification email could not be sent",
    );
  }
  return response;
}

export async function login(
  input: LoginInput,
  metadata: { userAgent?: string; ipAddress?: string },
) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, input.email))
    .limit(1);
  const validPassword = user?.passwordHash
    ? await argon2.verify(user.passwordHash, input.password).catch(() => false)
    : await argon2
        .verify(
          await argon2.hash("constant-time-invalid-password"),
          input.password,
        )
        .catch(() => false);
  if (!user || !validPassword)
    throw new AuthError(401, "Invalid email or password");
  if (!user.isActive) throw new AuthError(403, "This account is disabled");
  if (!user.emailVerifiedAt)
    throw new AuthError(403, "Verify your email before signing in");

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const [session] = await db
    .insert(sessionsTable)
    .values({
      userId: user.id,
      tokenHash: digest(token),
      userAgent: metadata.userAgent?.slice(0, 2000) ?? null,
      ipAddress: normalizeIp(metadata.ipAddress),
      expiresAt,
    })
    .returning({ id: sessionsTable.id });
  if (!session) throw new Error("Session creation failed");
  return { token, expiresAt, sessionId: session.id, user: toPublicUser(user) };
}

export async function authenticate(token: string) {
  if (!token) return null;
  const [row] = await db
    .select({
      id: sessionsTable.id,
      user: usersTable,
    })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .where(
      and(
        eq(sessionsTable.tokenHash, digest(token)),
        isNull(sessionsTable.revokedAt),
        gt(sessionsTable.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row || !row.user.emailVerifiedAt) return null;
  await db
    .update(sessionsTable)
    .set({ lastActiveAt: new Date() })
    .where(eq(sessionsTable.id, row.id));
  return { user: toPublicUser(row.user), sessionId: row.id };
}

export async function logout(token?: string) {
  if (!token) return;
  await db
    .update(sessionsTable)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(sessionsTable.tokenHash, digest(token)),
        isNull(sessionsTable.revokedAt),
      ),
    );
}

export async function forgotPassword(email: string) {
  const [user] = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(and(eq(usersTable.email, email), eq(usersTable.isActive, true)))
    .limit(1);

  const response = {
    message: "If an active account exists for that email, a reset code has been sent or was recently sent.",
  };
  if (!user) return response;

  const now = new Date();
  const challenge = await db.transaction(async (tx) => {
    const [latest] = await tx
      .select({ createdAt: passwordResetTokensTable.createdAt })
      .from(passwordResetTokensTable)
      .where(eq(passwordResetTokensTable.userId, user.id))
      .orderBy(desc(passwordResetTokensTable.createdAt))
      .limit(1);
    if (
      latest &&
      now.getTime() - latest.createdAt.getTime() < PASSWORD_RESET_RESEND_COOLDOWN_MS
    ) return null;

    await tx
      .update(passwordResetTokensTable)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokensTable.userId, user.id),
          isNull(passwordResetTokensTable.usedAt),
        ),
      );
    const otp = createVerificationCode();
    const [created] = await tx
      .insert(passwordResetTokensTable)
      .values({
        userId: user.id,
        codeHash: digestPasswordResetCode(user.id, otp),
        expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
      })
      .returning({ id: passwordResetTokensTable.id });
    if (!created) throw new Error("Password reset code creation failed");
    return { otp, challengeId: created.id };
  });
  if (!challenge) return response;

  try {
    await sendPasswordResetCode(user.email, user.name, challenge.otp);
  } catch (error) {
    await db
      .update(passwordResetTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokensTable.id, challenge.challengeId));
    // Keep the response identical for known and unknown emails to avoid account enumeration.
    console.error("Password reset email could not be sent", error);
  }
  return response;
}

export async function verifyPasswordResetOtp(input: VerifyPasswordResetOtpInput) {
  const now = new Date();
  const resetToken = randomBytes(32).toString("base64url");
  const verified = await db.transaction(async (tx) => {
    const [user] = await tx
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(and(eq(usersTable.email, input.email), eq(usersTable.isActive, true)))
      .limit(1);
    if (!user) return false;

    const [challenge] = await tx
      .select()
      .from(passwordResetTokensTable)
      .where(
        and(
          eq(passwordResetTokensTable.userId, user.id),
          isNull(passwordResetTokensTable.usedAt),
          isNull(passwordResetTokensTable.verifiedAt),
          gt(passwordResetTokensTable.expiresAt, now),
          lt(passwordResetTokensTable.attempts, PASSWORD_RESET_MAX_ATTEMPTS),
        ),
      )
      .orderBy(desc(passwordResetTokensTable.createdAt))
      .limit(1);
    if (!challenge) return false;

    const expectedHash = Buffer.from(challenge.codeHash, "hex");
    const submittedHash = Buffer.from(digestPasswordResetCode(user.id, input.otp), "hex");
    if (!timingSafeEqual(expectedHash, submittedHash)) {
      const [attempt] = await tx
        .update(passwordResetTokensTable)
        .set({ attempts: sql`${passwordResetTokensTable.attempts} + 1` })
        .where(
          and(
            eq(passwordResetTokensTable.id, challenge.id),
            isNull(passwordResetTokensTable.usedAt),
            isNull(passwordResetTokensTable.verifiedAt),
            gt(passwordResetTokensTable.expiresAt, now),
            lt(passwordResetTokensTable.attempts, PASSWORD_RESET_MAX_ATTEMPTS),
          ),
        )
        .returning({ attempts: passwordResetTokensTable.attempts });
      if (attempt && attempt.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
        await tx
          .update(passwordResetTokensTable)
          .set({ usedAt: now })
          .where(
            and(
              eq(passwordResetTokensTable.id, challenge.id),
              isNull(passwordResetTokensTable.usedAt),
            ),
          );
      }
      return false;
    }

    const [verifiedChallenge] = await tx
      .update(passwordResetTokensTable)
      .set({ verifiedAt: now, resetTokenHash: digest(resetToken) })
      .where(
        and(
          eq(passwordResetTokensTable.id, challenge.id),
          isNull(passwordResetTokensTable.usedAt),
          isNull(passwordResetTokensTable.verifiedAt),
          gt(passwordResetTokensTable.expiresAt, now),
          lt(passwordResetTokensTable.attempts, PASSWORD_RESET_MAX_ATTEMPTS),
        ),
      )
      .returning({ id: passwordResetTokensTable.id });
    if (!verifiedChallenge) return false;
    return true;
  });
  if (!verified) throw new AuthError(400, "Password reset code is invalid, expired, or locked");
  return { resetToken, message: "Code verified. You can now choose a new password." };
}

export async function resetPassword(input: ResetPasswordInput) {
  const now = new Date();
  const reset = await db.transaction(async (tx) => {
    const [challenge] = await tx
      .select({ id: passwordResetTokensTable.id, userId: passwordResetTokensTable.userId })
      .from(passwordResetTokensTable)
      .where(
        and(
          eq(passwordResetTokensTable.resetTokenHash, digest(input.resetToken)),
          isNotNull(passwordResetTokensTable.verifiedAt),
          isNull(passwordResetTokensTable.usedAt),
          gt(passwordResetTokensTable.expiresAt, now),
          lt(passwordResetTokensTable.attempts, PASSWORD_RESET_MAX_ATTEMPTS),
        ),
      )
      .limit(1);
    if (!challenge) return false;

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const [consumed] = await tx
      .update(passwordResetTokensTable)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokensTable.id, challenge.id),
          isNotNull(passwordResetTokensTable.verifiedAt),
          isNull(passwordResetTokensTable.usedAt),
          gt(passwordResetTokensTable.expiresAt, now),
        ),
      )
      .returning({ userId: passwordResetTokensTable.userId });
    if (!consumed) return false;

    const [updatedUser] = await tx
      .update(usersTable)
      .set({ passwordHash, updatedAt: now })
      .where(and(eq(usersTable.id, challenge.userId), eq(usersTable.isActive, true)))
      .returning({ id: usersTable.id });
    if (!updatedUser) return false;

    await tx
      .update(sessionsTable)
      .set({ revokedAt: now })
      .where(and(eq(sessionsTable.userId, updatedUser.id), isNull(sessionsTable.revokedAt)));
    return true;
  });
  if (!reset) throw new AuthError(400, "Password reset session is invalid or expired");
  return { message: "Password reset successfully. Please sign in with your new password." };
}

export async function changePassword(
  userId: string,
  currentSessionId: string,
  input: ChangePasswordInput,
) {
  const [user] = await db
    .select({ passwordHash: usersTable.passwordHash })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user?.passwordHash) throw new AuthError(400, "Current password is incorrect");

  const validPassword = await argon2
    .verify(user.passwordHash, input.currentPassword)
    .catch(() => false);
  if (!validPassword) throw new AuthError(400, "Current password is incorrect");

  const passwordHash = await argon2.hash(input.newPassword, { type: argon2.argon2id });
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ passwordHash, updatedAt: now })
      .where(eq(usersTable.id, userId));
    await tx
      .update(sessionsTable)
      .set({ revokedAt: now })
      .where(
        and(
          eq(sessionsTable.userId, userId),
          ne(sessionsTable.id, currentSessionId),
          isNull(sessionsTable.revokedAt),
        ),
      );
  });
  return { message: "Password changed successfully. Other active sessions were signed out." };
}

export async function getSessions(userId: string, currentSessionId: string) {
  const now = new Date();
  const rows = await db
    .select({
      id: sessionsTable.id,
      userAgent: sessionsTable.userAgent,
      ipAddress: sessionsTable.ipAddress,
      createdAt: sessionsTable.createdAt,
      lastActiveAt: sessionsTable.lastActiveAt,
      expiresAt: sessionsTable.expiresAt,
    })
    .from(sessionsTable)
    .where(
      and(
        eq(sessionsTable.userId, userId),
        isNull(sessionsTable.revokedAt),
        gt(sessionsTable.expiresAt, now),
      ),
    )
    .orderBy(desc(sessionsTable.lastActiveAt));
  return rows.map((session) => ({
    ...session,
    isCurrent: session.id === currentSessionId,
  }));
}

export async function revokeSession(userId: string, sessionId: string) {
  const [revoked] = await db
    .update(sessionsTable)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(sessionsTable.id, sessionId),
        eq(sessionsTable.userId, userId),
        isNull(sessionsTable.revokedAt),
      ),
    )
    .returning({ id: sessionsTable.id });
  if (!revoked) throw new AuthError(404, "Session not found");
  return { message: "Session signed out" };
}

export async function logoutAll(userId: string) {
  await db
    .update(sessionsTable)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessionsTable.userId, userId), isNull(sessionsTable.revokedAt)));
  return { message: "Signed out on all devices" };
}

export function sessionCookie(token: string, expiresAt: Date) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const sameSite = process.env.NODE_ENV === "production" ? "None" : "Lax";
  return `nexora_session=${token}; HttpOnly; SameSite=${sameSite}; Path=/; Expires=${expiresAt.toUTCString()}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const sameSite = process.env.NODE_ENV === "production" ? "None" : "Lax";
  return `nexora_session=; HttpOnly; SameSite=${sameSite}; Path=/; Max-Age=0${secure}`;
}

function normalizeIp(ip?: string) {
  if (!ip) return null;
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

function isUniqueViolation(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
