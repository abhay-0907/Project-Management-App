import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users.schema.js";

export const passwordResetTokensTable = pgTable(
  "password_reset_tokens",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    // Persist only an HMAC of the short-lived code sent to the user.
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    attempts: integer().notNull().default(0),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    // A separate high-entropy ticket is issued after the OTP has been verified.
    resetTokenHash: varchar("reset_token_hash", { length: 64 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("password_reset_tokens_code_hash_uidx").on(table.codeHash),
    uniqueIndex("password_reset_tokens_reset_token_hash_uidx").on(table.resetTokenHash),
    index("password_reset_tokens_user_expires_idx").on(
      table.userId,
      table.expiresAt,
    ),
    check(
      "password_reset_tokens_code_hash_sha256_check",
      sql`${table.codeHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "password_reset_tokens_attempts_check",
      sql`${table.attempts} >= 0 AND ${table.attempts} <= 5`,
    ),
    check(
      "password_reset_tokens_reset_token_hash_check",
      sql`${table.resetTokenHash} IS NULL OR ${table.resetTokenHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "password_reset_tokens_verified_ticket_check",
      sql`${table.resetTokenHash} IS NULL OR ${table.verifiedAt} IS NOT NULL`,
    ),
    check(
      "password_reset_tokens_expires_after_created_check",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
  ],
);

export type PasswordResetToken = typeof passwordResetTokensTable.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokensTable.$inferInsert;
