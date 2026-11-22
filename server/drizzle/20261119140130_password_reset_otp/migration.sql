ALTER TABLE "password_reset_tokens" RENAME COLUMN "token_hash" TO "code_hash";--> statement-breakpoint
ALTER TABLE "password_reset_tokens" RENAME CONSTRAINT "password_reset_tokens_token_hash_sha256_check" TO "password_reset_tokens_code_hash_sha256_check";--> statement-breakpoint
ALTER INDEX "password_reset_tokens_token_hash_uidx" RENAME TO "password_reset_tokens_code_hash_uidx";--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_attempts_check" CHECK ("attempts" >= 0 AND "attempts" <= 5);--> statement-breakpoint
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_code_hash_sha256_check", ADD CONSTRAINT "password_reset_tokens_code_hash_sha256_check" CHECK ("code_hash" ~ '^[0-9a-f]{64}$');