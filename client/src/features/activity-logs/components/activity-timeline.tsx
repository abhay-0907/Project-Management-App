"use client";

import Link from "next/link";
import { useActivityFeed } from "../hooks/use-activity-feed";
import type { ActivityRecord } from "../api/activity.api";

type Props = {
  workspaceId: string | undefined;
  workspaceSlug: string;
  projectId?: string;
  taskId?: string;
  limit?: number;
  emptyMessage?: string;
};

export function ActivityTimeline({
  workspaceId,
  workspaceSlug,
  projectId,
  taskId,
  limit = 8,
  emptyMessage = "No activity has been recorded yet.",
}: Props) {
  const query = useActivityFeed(workspaceId, { page: 1, pageSize: limit, projectId, taskId });
  if (query.isPending) return <p className="activity-state" role="status">Loading activity…</p>;
  if (query.isError) return <p className="activity-state" role="alert">{query.error.message}</p>;
  if (!query.data?.activities.length) return <p className="activity-state">{emptyMessage}</p>;

  return <ActivityEntries activities={query.data.activities} workspaceSlug={workspaceSlug} />;
}

export function ActivityEntries({
  activities,
  workspaceSlug,
}: {
  activities: ActivityRecord[];
  workspaceSlug: string;
}) {
  return (
    <ol className="activity-timeline">
      {activities.map((activity) => {
        const href = activityHref(activity, workspaceSlug);
        const row = (
          <>
            <span className="activity-avatar" aria-hidden="true">{initials(activity.actorName)}</span>
            <span className="activity-copy">
              <span className="activity-description"><strong>{activity.actorName ?? "Former member"}</strong> {describe(activity)}</span>
              {activity.entityName && <span className="activity-entity">{activity.entityName}</span>}
              {detail(activity) && <span className="activity-detail">{detail(activity)}</span>}
              <time dateTime={activity.createdAt}>{relativeTime(activity.createdAt)}</time>
            </span>
          </>
        );
        return (
          <li className="activity-entry" key={activity.id}>
            {href ? <Link href={href} className="activity-entry-link">{row}</Link> : <div className="activity-entry-link">{row}</div>}
          </li>
        );
      })}
    </ol>
  );
}

function describe(activity: ActivityRecord) {
  const descriptions: Record<ActivityRecord["action"], string> = {
    WORKSPACE_CREATED: "created the workspace",
    WORKSPACE_UPDATED: "updated the workspace",
    WORKSPACE_DELETED: "deleted the workspace",
    MEMBER_ADDED: "added a workspace member",
    MEMBER_ROLE_CHANGED: "changed a member's role",
    MEMBER_REMOVED: "removed a workspace member",
    INVITATION_CREATED: "prepared an invitation for",
    INVITATION_SENT: "invited",
    INVITATION_RESENT: "resent an invitation to",
    INVITATION_ACCEPTED: "accepted an invitation to",
    INVITATION_REJECTED: "declined an invitation to",
    INVITATION_CANCELLED: "cancelled an invitation for",
    PROJECT_CREATED: "created a project",
    PROJECT_UPDATED: "updated a project",
    PROJECT_DELETED: "deleted a project",
    TASK_CREATED: "created a task",
    TASK_UPDATED: "updated a task",
    TASK_STATUS_CHANGED: "changed task status",
    TASK_PRIORITY_CHANGED: "changed task priority",
    TASK_ASSIGNEE_CHANGED: "changed task assignee",
    TASK_DUE_DATE_CHANGED: "changed a task due date",
    TASK_DELETED: "deleted a task",
    BOARD_COLUMN_CREATED: "created a board column",
    BOARD_COLUMN_RENAMED: "renamed a board column",
    BOARD_COLUMN_REORDERED: "reordered a board column",
    BOARD_COLUMN_UPDATED: "updated a board column",
    BOARD_COLUMN_DELETED: "deleted a board column",
  };
  return descriptions[activity.action];
}

function detail(activity: ActivityRecord) {
  const metadata = activity.metadata;
  const changes = metadata.changes as Record<string, { old?: unknown; new?: unknown }> | undefined;
  if (changes?.status) return `${nameOf(changes.status.old)} → ${nameOf(changes.status.new)}`;
  if (changes?.priority) return `${String(changes.priority.old)} → ${String(changes.priority.new)}`;
  if (changes?.assignee) return `${nameOf(changes.assignee.old)} → ${nameOf(changes.assignee.new)}`;
  if (changes?.dueDate) return `${dateOf(changes.dueDate.old)} → ${dateOf(changes.dueDate.new)}`;
  if (changes?.startDate) return `${dateOf(changes.startDate.old)} → ${dateOf(changes.startDate.new)}`;
  if (changes?.role) return `${String(changes.role.old)} → ${String(changes.role.new)}`;
  if (changes?.name) return `${String(changes.name.old)} → ${String(changes.name.new)}`;
  if (changes?.title) return `${String(changes.title.old)} → ${String(changes.title.new)}`;
  if (changes?.slug) return `${String(changes.slug.old)} → ${String(changes.slug.new)}`;
  if (changes?.position) return `Position ${String(changes.position.old)} → ${String(changes.position.new)}`;
  if (changes?.color) return `Color ${String(changes.color.old)} → ${String(changes.color.new)}`;
  if (changes?.isDefault) return `Default column: ${String(changes.isDefault.old)} → ${String(changes.isDefault.new)}`;
  if (changes?.isCompleted) return `Completion status: ${String(changes.isCompleted.old)} → ${String(changes.isCompleted.new)}`;
  if (activity.action === "MEMBER_ROLE_CHANGED" && typeof metadata.oldRole === "string" && typeof metadata.newRole === "string") {
    return `${metadata.oldRole} → ${metadata.newRole}`;
  }
  if (activity.action === "TASK_CREATED" && typeof metadata.priority === "string") {
    return `${metadata.priority} priority${metadata.status && typeof metadata.status === "object" ? ` · ${nameOf(metadata.status)}` : ""}`;
  }
  if (activity.action === "MEMBER_REMOVED" && typeof metadata.affectedTaskCount === "number" && metadata.affectedTaskCount > 0) {
    return `${metadata.affectedTaskCount} assigned task${metadata.affectedTaskCount === 1 ? "" : "s"} unassigned`;
  }
  return "";
}

function nameOf(value: unknown) {
  if (!value || typeof value !== "object") return value == null ? "Unassigned" : String(value);
  const object = value as Record<string, unknown>;
  return String(object.name ?? object.id ?? "Unknown");
}

function dateOf(value: unknown) {
  if (!value) return "No date";
  const text = String(value);
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T12:00:00` : text);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

function relativeTime(value: string) {
  const age = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(age / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function activityHref(activity: ActivityRecord, slug: string) {
  const projectId = typeof activity.metadata.projectId === "string" ? activity.metadata.projectId : undefined;
  if (activity.entityType === "TASK" && projectId) return `/${slug}/tasks/${encodeURIComponent(activity.entityId)}?projectId=${encodeURIComponent(projectId)}`;
  if (activity.entityType === "PROJECT") return `/${slug}/projects/${encodeURIComponent(activity.entityId)}`;
  if (activity.entityType === "BOARD_COLUMN" && projectId) return `/${slug}/projects/${encodeURIComponent(projectId)}/board`;
  return undefined;
}
