"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/shared/icon";
import { Combobox } from "@/components/ui/combobox";
import { Select } from "@/components/ui/select";
import { useActivityFeed } from "../hooks/use-activity-feed";
import type { ActivityAction, ActivityEntityType, ActivityFilter } from "../api/activity.api";
import { ActivityEntries } from "./activity-timeline";
import { useWorkspaceMembers } from "@/features/workspaces/hooks/use-workspace-members";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";

const PAGE_SIZE = 25;

const actions: ActivityAction[] = [
  "WORKSPACE_CREATED", "WORKSPACE_UPDATED", "WORKSPACE_DELETED",
  "MEMBER_ADDED", "MEMBER_ROLE_CHANGED", "MEMBER_REMOVED",
  "INVITATION_CREATED", "INVITATION_SENT", "INVITATION_RESENT",
  "INVITATION_ACCEPTED", "INVITATION_REJECTED", "INVITATION_CANCELLED",
  "PROJECT_CREATED", "PROJECT_UPDATED", "PROJECT_DELETED",
  "TASK_CREATED", "TASK_UPDATED", "TASK_STATUS_CHANGED", "TASK_PRIORITY_CHANGED",
  "TASK_ASSIGNEE_CHANGED", "TASK_DUE_DATE_CHANGED", "TASK_DELETED",
  "BOARD_COLUMN_CREATED", "BOARD_COLUMN_RENAMED", "BOARD_COLUMN_REORDERED",
  "BOARD_COLUMN_UPDATED", "BOARD_COLUMN_DELETED",
];

const entityTypes: ActivityEntityType[] = [
  "WORKSPACE", "MEMBER", "INVITATION", "PROJECT", "TASK", "BOARD_COLUMN",
];

type InboxFilters = Pick<ActivityFilter, "action" | "actorId" | "entityType" | "from" | "to">;

export function ActivityInboxPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const workspacesQuery = useWorkspaces();
  const workspace = workspacesQuery.data?.find((item) => item.slug === workspaceSlug);
  const membersQuery = useWorkspaceMembers(workspace?.id);
  const [filters, setFilters] = useState<InboxFilters>({});
  const [page, setPage] = useState(1);
  const activityQuery = useActivityFeed(workspace?.id, { ...filters, page, pageSize: PAGE_SIZE });

  function updateFilter<K extends keyof InboxFilters>(key: K, value: InboxFilters[K] | undefined) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters({});
    setPage(1);
  }

  if (workspacesQuery.isPending) {
    return <main className="workspace-route-state" role="status"><span className="workspace-spinner" /><p>Loading workspace…</p></main>;
  }

  if (workspacesQuery.isError) {
    return <main className="workspace-route-state" role="alert"><h1>Activity unavailable</h1><p>{workspacesQuery.error.message}</p><button className="button button-secondary" type="button" onClick={() => { void workspacesQuery.refetch(); }}>Try again</button></main>;
  }

  if (!workspace) {
    return <main className="workspace-route-state"><span className="empty-icon"><Icon name="folder" size={19} /></span><h1>Workspace unavailable</h1><p>Choose a workspace to view its activity.</p><Link className="button button-primary" href="/workspaces">Choose workspace</Link></main>;
  }

  const pagination = activityQuery.data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const rangeStart = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <main className="activity-inbox-page">
      <section className="activity-inbox-heading">
        <div>
          <span className="eyebrow">WORKSPACE HISTORY · {workspace.name}</span>
          <h1>Activity</h1>
          <p className="page-subtitle">A chronological record of important changes made by your team.</p>
        </div>
        <span className="activity-total">{total} {total === 1 ? "event" : "events"}</span>
      </section>

      <section className="panel activity-inbox-panel" aria-label="Workspace activity">
        <div className="activity-filters" role="search" aria-label="Filter activity">
          <div className="activity-filter-field">
            <label htmlFor="activity-action">Action</label>
            <Combobox
              id="activity-action"
              ariaLabel="Filter activity by action"
              value={filters.action ?? ""}
              onValueChange={(value) => updateFilter("action", value ? value as ActivityAction : undefined)}
              options={[
                { value: "", label: "All actions" },
                ...actions.map((action) => ({ value: action, label: formatLabel(action) })),
              ]}
            />
          </div>
          <div className="activity-filter-field">
            <label htmlFor="activity-actor">Changed by</label>
            <Combobox
              id="activity-actor"
              ariaLabel="Filter activity by member"
              value={filters.actorId ?? ""}
              onValueChange={(value) => updateFilter("actorId", value || undefined)}
              isDisabled={membersQuery.isPending || membersQuery.isError}
              options={[
                { value: "", label: "Anyone" },
                ...(membersQuery.data?.map((member) => ({ value: member.id, label: member.name })) ?? []),
              ]}
            />
          </div>
          <div className="activity-filter-field">
            <label htmlFor="activity-entity">Item type</label>
            <Select
              id="activity-entity"
              ariaLabel="Filter activity by item type"
              value={filters.entityType ?? ""}
              onValueChange={(value) => updateFilter("entityType", value ? value as ActivityEntityType : undefined)}
              options={[
                { value: "", label: "All item types" },
                ...entityTypes.map((type) => ({ value: type, label: formatLabel(type) })),
              ]}
            />
          </div>
          <div className="activity-filter-field">
            <label htmlFor="activity-from">From</label>
            <input id="activity-from" type="date" max={filters.to} value={filters.from ?? ""} onChange={(event) => updateFilter("from", event.currentTarget.value || undefined)} />
          </div>
          <div className="activity-filter-field">
            <label htmlFor="activity-to">To</label>
            <input id="activity-to" type="date" min={filters.from} value={filters.to ?? ""} onChange={(event) => updateFilter("to", event.currentTarget.value || undefined)} />
          </div>
          <div className="activity-filter-actions">
            <button className="button button-quiet" type="button" onClick={clearFilters} disabled={!hasFilters}>Clear filters</button>
          </div>
        </div>

        <div className="activity-inbox-feed" aria-live="polite">
          {activityQuery.isPending && <p className="activity-state" role="status">Loading activity…</p>}
          {activityQuery.isError && <div className="activity-page-error" role="alert"><p>{activityQuery.error.message}</p><button className="button button-secondary" type="button" onClick={() => { void activityQuery.refetch(); }}>Try again</button></div>}
          {!activityQuery.isPending && !activityQuery.isError && activityQuery.data?.activities.length === 0 && (
            <div className="activity-page-empty"><span className="empty-icon"><Icon name="activity" size={19} /></span><h2>{hasFilters ? "No matching activity" : "No activity yet"}</h2><p>{hasFilters ? "Try changing or clearing your filters." : "Important workspace changes will appear here."}</p>{hasFilters && <button className="button button-secondary" type="button" onClick={clearFilters}>Clear filters</button>}</div>
          )}
          {!activityQuery.isPending && !activityQuery.isError && Boolean(activityQuery.data?.activities.length) && (
            <ActivityEntries activities={activityQuery.data!.activities} workspaceSlug={workspaceSlug} />
          )}
        </div>

        {!activityQuery.isPending && !activityQuery.isError && activityQuery.data && (
          <footer className="activity-inbox-pagination">
            <span>Showing {rangeStart}–{rangeEnd} of {total}</span>
            {totalPages > 1 && <div>
              <button className="button button-secondary" type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button className="button button-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
            </div>}
          </footer>
        )}
      </section>
    </main>
  );
}

function formatLabel(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
