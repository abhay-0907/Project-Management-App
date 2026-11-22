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

export const emailVerificationTokensTable = pgTable(
  "email_verification_tokens",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    // Store the address the token was issued for, so an old token cannot
    // verify a different address if the user's email changes.
    email: varchar({ length: 255 }).notNull(),
    // Persist only an HMAC of the short-lived one-time code sent to the user.
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    attempts: integer().notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("email_verification_tokens_code_hash_uidx").on(table.codeHash),
    index("email_verification_tokens_user_expires_idx").on(
      table.userId,
      table.expiresAt,
    ),
    check(
      "email_verification_tokens_code_hash_sha256_check",
      sql`${table.codeHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "email_verification_tokens_attempts_check",
      sql`${table.attempts} >= 0 AND ${table.attempts} <= 5`,
    ),
    check(
      "email_verification_tokens_expires_after_created_check",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
  ],
);

export type EmailVerificationToken =
  typeof emailVerificationTokensTable.$inferSelect;
export type NewEmailVerificationToken =
  typeof emailVerificationTokensTable.$inferInsert;
