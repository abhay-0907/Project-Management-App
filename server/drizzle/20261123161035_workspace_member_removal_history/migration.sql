ALTER TABLE "tasks" DROP CONSTRAINT "tasks_creator_workspace_member_fk";--> statement-breakpoint
ALTER TABLE "comments" DROP CONSTRAINT "comments_author_workspace_member_fk";--> statement-breakpoint
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_uploader_workspace_member_fk";--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_actor_workspace_member_fk";--> statement-breakpoint
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_workspace_inviter_membership_fk";--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creator_user_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_user_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploader_user_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_user_fk" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT;