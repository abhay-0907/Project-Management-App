CREATE TYPE "workspace_role" AS ENUM('OWNER', 'ADMIN', 'MEMBER');--> statement-breakpoint
CREATE TYPE "invitation_role" AS ENUM('ADMIN', 'MEMBER');--> statement-breakpoint
CREATE TYPE "invitation_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "project_lifecycle" AS ENUM('ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "project_member_role" AS ENUM('PROJECT_MANAGER', 'MEMBER', 'VIEWER');--> statement-breakpoint
CREATE TYPE "task_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"is_active" boolean DEFAULT true NOT NULL,
	"password_hash" varchar(255),
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"user_agent" text,
	"ip_address" inet,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_sha256_check" CHECK ("token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "sessions_expires_after_created_check" CHECK ("expires_at" > "created_at")
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_code_hash_sha256_check" CHECK ("code_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "email_verification_tokens_attempts_check" CHECK ("attempts" >= 0 AND "attempts" <= 5),
	CONSTRAINT "email_verification_tokens_expires_after_created_check" CHECK ("expires_at" > "created_at")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_sha256_check" CHECK ("token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "password_reset_tokens_expires_after_created_check" CHECK ("expires_at" > "created_at")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(150) NOT NULL,
	"slug" varchar(100) NOT NULL UNIQUE,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "workspace_role" DEFAULT 'MEMBER'::"workspace_role" NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" uuid NOT NULL,
	"invited_by" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "invitation_role" DEFAULT 'MEMBER'::"invitation_role" NOT NULL,
	"token_hash" varchar(255) NOT NULL UNIQUE,
	"status" "invitation_status" DEFAULT 'PENDING'::"invitation_status" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"created_by" uuid NOT NULL,
	"start_date" date,
	"due_date" date,
	"status" "project_lifecycle" DEFAULT 'ACTIVE'::"project_lifecycle" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_date_order_check" CHECK ("due_date" IS NULL OR "start_date" IS NULL OR "due_date" >= "start_date")
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "project_member_role" DEFAULT 'MEMBER'::"project_member_role" NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"position" integer NOT NULL,
	"color" varchar(30),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"status_id" uuid NOT NULL,
	"parent_task_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"assignee_id" uuid,
	"created_by" uuid NOT NULL,
	"priority" "task_priority" DEFAULT 'MEDIUM'::"task_priority" NOT NULL,
	"position" double precision DEFAULT 0 NOT NULL,
	"start_date" date,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_date_order_check" CHECK ("due_date" IS NULL OR "start_date" IS NULL OR "due_date" >= "start_date")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"color" varchar(30)
);
--> statement-breakpoint
CREATE TABLE "task_labels" (
	"workspace_id" uuid NOT NULL,
	"task_id" uuid,
	"label_id" uuid,
	CONSTRAINT "task_labels_pkey" PRIMARY KEY("task_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" uuid NOT NULL,
	"actor_id" uuid,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_uidx" ON "sessions" ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_expires_idx" ON "sessions" ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "sessions_user_last_active_idx" ON "sessions" ("user_id","last_active_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_verification_tokens_code_hash_uidx" ON "email_verification_tokens" ("code_hash");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_user_expires_idx" ON "email_verification_tokens" ("user_id","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_uidx" ON "password_reset_tokens" ("token_hash");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_expires_idx" ON "password_reset_tokens" ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "workspaces_created_by_idx" ON "workspaces" ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_workspace_user_uidx" ON "workspace_members" ("workspace_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_single_owner_uidx" ON "workspace_members" ("workspace_id") WHERE "role" = 'OWNER';--> statement-breakpoint
CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_pending_email_uidx" ON "invitations" ("workspace_id",lower("email")) WHERE "status" = 'PENDING';--> statement-breakpoint
CREATE INDEX "invitations_workspace_status_idx" ON "invitations" ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "invitations_expires_at_idx" ON "invitations" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_workspace_id_uidx" ON "projects" ("workspace_id","id");--> statement-breakpoint
CREATE INDEX "projects_workspace_status_idx" ON "projects" ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "projects_created_by_idx" ON "projects" ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "project_members_project_user_uidx" ON "project_members" ("project_id","user_id");--> statement-breakpoint
CREATE INDEX "project_members_user_id_idx" ON "project_members" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_statuses_project_slug_uidx" ON "project_statuses" ("project_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "project_statuses_tenant_candidate_uidx" ON "project_statuses" ("id","project_id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_statuses_one_default_uidx" ON "project_statuses" ("project_id") WHERE "is_default" = true;--> statement-breakpoint
CREATE INDEX "project_statuses_project_position_idx" ON "project_statuses" ("project_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_id_workspace_uidx" ON "tasks" ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_id_project_workspace_uidx" ON "tasks" ("id","project_id","workspace_id");--> statement-breakpoint
CREATE INDEX "tasks_project_status_position_idx" ON "tasks" ("project_id","status_id","position");--> statement-breakpoint
CREATE INDEX "tasks_workspace_assignee_idx" ON "tasks" ("workspace_id","assignee_id");--> statement-breakpoint
CREATE INDEX "tasks_workspace_due_date_idx" ON "tasks" ("workspace_id","due_date");--> statement-breakpoint
CREATE INDEX "comments_task_created_idx" ON "comments" ("task_id","created_at");--> statement-breakpoint
CREATE INDEX "comments_workspace_id_idx" ON "comments" ("workspace_id");--> statement-breakpoint
CREATE INDEX "attachments_task_created_idx" ON "attachments" ("task_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "labels_workspace_name_uidx" ON "labels" ("workspace_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "labels_id_workspace_uidx" ON "labels" ("id","workspace_id");--> statement-breakpoint
CREATE INDEX "labels_workspace_id_idx" ON "labels" ("workspace_id");--> statement-breakpoint
CREATE INDEX "activity_logs_workspace_created_idx" ON "activity_logs" ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_logs_entity_idx" ON "activity_logs" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "notifications_user_read_created_idx" ON "notifications" ("user_id","read_at","created_at");--> statement-breakpoint
CREATE INDEX "notifications_workspace_created_idx" ON "notifications" ("workspace_id","created_at");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspace_inviter_membership_fk" FOREIGN KEY ("workspace_id","invited_by") REFERENCES "workspace_members"("workspace_id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_workspace_fk" FOREIGN KEY ("workspace_id","project_id") REFERENCES "projects"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_workspace_user_fk" FOREIGN KEY ("workspace_id","user_id") REFERENCES "workspace_members"("workspace_id","user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_statuses" ADD CONSTRAINT "project_statuses_project_workspace_fk" FOREIGN KEY ("workspace_id","project_id") REFERENCES "projects"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_workspace_fk" FOREIGN KEY ("workspace_id","project_id") REFERENCES "projects"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_status_project_workspace_fk" FOREIGN KEY ("status_id","project_id","workspace_id") REFERENCES "project_statuses"("id","project_id","workspace_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_workspace_member_fk" FOREIGN KEY ("workspace_id","assignee_id") REFERENCES "workspace_members"("workspace_id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creator_workspace_member_fk" FOREIGN KEY ("workspace_id","created_by") REFERENCES "workspace_members"("workspace_id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_same_project_workspace_fk" FOREIGN KEY ("parent_task_id","project_id","workspace_id") REFERENCES "tasks"("id","project_id","workspace_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_task_workspace_fk" FOREIGN KEY ("task_id","workspace_id") REFERENCES "tasks"("id","workspace_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_workspace_member_fk" FOREIGN KEY ("workspace_id","author_id") REFERENCES "workspace_members"("workspace_id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_task_workspace_fk" FOREIGN KEY ("task_id","workspace_id") REFERENCES "tasks"("id","workspace_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploader_workspace_member_fk" FOREIGN KEY ("workspace_id","uploaded_by") REFERENCES "workspace_members"("workspace_id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_task_workspace_fk" FOREIGN KEY ("task_id","workspace_id") REFERENCES "tasks"("id","workspace_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_label_workspace_fk" FOREIGN KEY ("label_id","workspace_id") REFERENCES "labels"("id","workspace_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_workspace_member_fk" FOREIGN KEY ("workspace_id","actor_id") REFERENCES "workspace_members"("workspace_id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_workspace_member_fk" FOREIGN KEY ("workspace_id","user_id") REFERENCES "workspace_members"("workspace_id","user_id") ON DELETE CASCADE;