ALTER TABLE "activity_logs" ADD COLUMN "workspace_name" varchar(150);--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "actor_name" varchar(100);--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "entity_name" varchar(255);--> statement-breakpoint
ALTER TABLE "activity_logs" ALTER COLUMN "workspace_id" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "activity_logs_workspace_action_created_idx" ON "activity_logs" ("workspace_id","action","created_at");--> statement-breakpoint
CREATE INDEX "activity_logs_workspace_actor_created_idx" ON "activity_logs" ("workspace_id","actor_id","created_at");--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_workspace_id_workspaces_id_fkey", ADD CONSTRAINT "activity_logs_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_actor_user_fk", ADD CONSTRAINT "activity_logs_actor_user_fk" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL;