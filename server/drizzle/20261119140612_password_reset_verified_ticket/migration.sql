ALTER TABLE "password_reset_tokens" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD COLUMN "reset_token_hash" varchar(64);--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_tokens_reset_token_hash_uidx" ON "password_reset_tokens" ("reset_token_hash");--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_reset_token_hash_check" CHECK ("reset_token_hash" IS NULL OR "reset_token_hash" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_verified_ticket_check" CHECK ("reset_token_hash" IS NULL OR "verified_at" IS NOT NULL);