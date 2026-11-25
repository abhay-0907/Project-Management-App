ALTER TABLE "activity_logs" ADD COLUMN "workspace_name" varchar(150);
ALTER TABLE "activity_logs" ADD COLUMN "actor_name" varchar(100);
ALTER TABLE "activity_logs" ADD COLUMN "entity_name" varchar(255);

UPDATE "activity_logs" AS activity
SET "actor_name" = users."name"
FROM "users" AS users
WHERE activity."actor_id" = users."id";

UPDATE "activity_logs" AS activity
SET "workspace_name" = workspaces."name"
FROM "workspaces" AS workspaces
WHERE activity."workspace_id" = workspaces."id";

UPDATE "activity_logs" AS activity
SET "entity_name" = projects."name"
FROM "projects" AS projects
WHERE upper(activity."entity_type") = 'PROJECT' AND activity."entity_id" = projects."id";

UPDATE "activity_logs" AS activity
SET "entity_name" = tasks."title"
FROM "tasks" AS tasks
WHERE upper(activity."entity_type") = 'TASK' AND activity."entity_id" = tasks."id";

UPDATE "activity_logs" AS activity
SET "entity_name" = users."name"
FROM "users" AS users
WHERE upper(activity."entity_type") = 'MEMBER' AND activity."entity_id" = users."id";

UPDATE "activity_logs" AS activity
SET "entity_name" = invitations."email"
FROM "invitations" AS invitations
WHERE upper(activity."entity_type") = 'INVITATION' AND activity."entity_id" = invitations."id";

UPDATE "activity_logs" AS activity
SET "entity_name" = statuses."name"
FROM "project_statuses" AS statuses
WHERE upper(activity."entity_type") = 'BOARD_COLUMN' AND activity."entity_id" = statuses."id";

UPDATE "activity_logs" AS activity
SET "entity_name" = workspaces."name"
FROM "workspaces" AS workspaces
WHERE upper(activity."entity_type") = 'WORKSPACE' AND activity."entity_id" = workspaces."id";

ALTER TABLE "activity_logs" ALTER COLUMN "workspace_id" DROP NOT NULL;
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_workspace_id_workspaces_id_fkey";
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_workspace_id_workspaces_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL;
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_actor_user_fk";
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_user_fk"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL;

CREATE INDEX "activity_logs_workspace_action_created_idx"
  ON "activity_logs" ("workspace_id", "action", "created_at");
CREATE INDEX "activity_logs_workspace_actor_created_idx"
  ON "activity_logs" ("workspace_id", "actor_id", "created_at");
