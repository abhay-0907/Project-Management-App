"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { Icon } from "@/components/shared/icon";
import { ProjectApiError } from "@/features/projects/api/project.api";
import { TaskApiError } from "@/features/tasks/api/task.api";
import {
  useWorkspaceTaskOverview,
  type WorkspaceTaskOverview,
} from "@/features/tasks/hooks/use-workspace-task-overview";
import { WorkspaceApiError } from "@/features/workspaces/api/workspace.api";
import { useWorkspaceMembers } from "@/features/workspaces/hooks/use-workspace-members";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { ActivityTimeline } from "@/features/activity-logs/components/activity-timeline";

export function WorkspaceDashboard() {
  const params = useParams<{ workspaceSlug: string }>();
  const router = useRouter();
  const slug = params.workspaceSlug;
  const workspacesQuery = useWorkspaces();
  const workspace = workspacesQuery.data?.find((item) => item.slug === slug);
  const overviewQuery = useWorkspaceTaskOverview(workspace?.id);
  const membersQuery = useWorkspaceMembers(workspace?.id);
  const currentUserQuery = useCurrentUser();

  useEffect(() => {
    if (
      [
        workspacesQuery.error,
        overviewQuery.error,
        membersQuery.error,
        currentUserQuery.error,
      ].some(isUnauthorized)
    ) {
      router.replace("/login");
      return;
    }
    if (workspacesQuery.isSuccess && !workspace) router.replace("/workspaces");
  }, [
    currentUserQuery.error,
    membersQuery.error,
    overviewQuery.error,
    router,
    workspace,
    workspacesQuery.error,
    workspacesQuery.isSuccess,
  ]);

  if (
    workspacesQuery.isPending ||
    (workspace &&
      (overviewQuery.isPending ||
        membersQuery.isPending ||
        currentUserQuery.isPending))
  ) {
    return (
      <main className="workspace-route-state" role="status" aria-live="polite">
        <span className="workspace-spinner" />
        <p>Loading your workspace…</p>
      </main>
    );
  }

  if (
    workspacesQuery.isError ||
    overviewQuery.isError ||
    currentUserQuery.isError
  ) {
    const error =
      workspacesQuery.error ?? overviewQuery.error ?? currentUserQuery.error;
    return (
      <main className="workspace-route-state" role="alert">
        <span className="empty-icon">
          <Icon name="activity" size={19} />
        </span>
        <h1>Workspace overview unavailable</h1>
        <p>
          {error instanceof Error
            ? error.message
            : "Workspace data could not be loaded."}
        </p>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => {
            void workspacesQuery.refetch();
            void overviewQuery.refetch();
            void currentUserQuery.refetch();
          }}
        >
          Try again
        </button>
      </main>
    );
  }

  if (!workspace || !overviewQuery.data || !currentUserQuery.data) {
    return (
      <main className="workspace-route-state">
        <span className="empty-icon">
          <Icon name="folder" size={19} />
        </span>
        <h1>Workspace unavailable</h1>
        <p>Choose a workspace to see its projects and tasks.</p>
        <Link className="button button-primary" href="/workspaces">
          Choose workspace
        </Link>
      </main>
    );
  }

  const currentUser = currentUserQuery.data;
  const overview = overviewQuery.data;
  const projectTasks = overview.tasks.filter(({ task }) => !task.parentTaskId);
  const completedTasks = projectTasks.filter(
    ({ task }) => task.status?.isCompleted,
  );
  const openTasks = projectTasks.filter(
    ({ task }) => !task.status?.isCompleted,
  );
  const myTasks = openTasks.filter(
    ({ task }) => task.assigneeId === currentUser.id,
  );
  const activeProjects = overview.projects.filter(
    (project) => project.status === "ACTIVE",
  );
  const completedProjects = overview.projects.filter(
    (project) => project.status === "COMPLETED",
  ).length;
  const urgentTasks = openTasks.filter(
    ({ task }) => task.priority === "URGENT",
  ).length;
  const upcomingTasks = [...openTasks]
    .filter(({ task }) => task.dueDate)
    .sort((a, b) => (a.task.dueDate ?? "").localeCompare(b.task.dueDate ?? ""))
    .slice(0, 4);
  const statusRows = aggregateStatuses(overview);
  const statusTotal = statusRows.reduce((sum, row) => sum + row.count, 0) || 1;
  const statusTotals = statusRows.map((row) => ({
    ...row,
    percent: Math.round((row.count / statusTotal) * 100),
  }));
  const members = membersQuery.data ?? [];

  return (
    <div className="dashboard-page">
      <section className="welcome-row">
        <div>
          <div className="eyebrow welcome-eyebrow">
            <span className="live-dot" /> YOUR WORKSPACE ·{" "}
            {workspace.name.toUpperCase()}
          </div>
          <h1>
            Good morning, {currentUserQuery.data.name.split(" ")[0]}{" "}
            <span className="wave">✦</span>
          </h1>
          <p className="page-subtitle">
            A clear view of the work moving across your team today.
          </p>
        </div>
        <div className="welcome-actions">
          <span className="select-with-icon">
            <Icon name="activity" size={16} /> Current status
          </span>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => router.push(`/${slug}/members`)}
          >
            <Icon name="user-plus" size={16} /> Invite people
          </button>
          <Link className="button button-dark" href={`/${slug}/projects`}>
            <Icon name="chart" size={16} /> View projects{" "}
            <Icon name="arrow-right" size={15} />
          </Link>
        </div>
      </section>

      <section className="metric-grid" aria-label="Workspace summary">
        <MetricCard
          label="Active projects"
          value={count(activeProjects.length)}
          detail={`${completedProjects} completed`}
          icon="folder"
          accent="blue"
          trend="Current"
        />
        <MetricCard
          label="Open tasks"
          value={count(openTasks.length)}
          detail={`${myTasks.length} assigned to you`}
          icon="check-circle"
          accent="violet"
          trend={`${urgentTasks} urgent`}
        />
        <MetricCard
          label="Completed tasks"
          value={count(completedTasks.length)}
          detail="Across this workspace"
          icon="target"
          accent="green"
          trend="Total"
        />
        <MetricCard
          label="Team members"
          value={count(members.length)}
          detail="Workspace access"
          icon="users"
          accent="amber"
          trend={`${members.filter((member) => member.isActive).length} active`}
        />
      </section>

      <section className="dashboard-main-grid">
        <div className="dashboard-primary-column">
          <article className="panel delivery-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">WORK IN MOTION</span>
                <h2>Task distribution</h2>
                <p>Tasks grouped by their current project status</p>
              </div>
              <span className="period-chip">Current status</span>
            </div>
            {statusRows.length > 0 ? (
              <>
                <div
                  className="distribution-bar"
                  role="img"
                  aria-label="Task distribution by status"
                >
                  {statusTotals.map(
                    (row) =>
                      row.count > 0 && (
                        <span
                          key={row.slug}
                          style={{
                            width: `${row.percent}%`,
                            background: row.color,
                          }}
                        />
                      ),
                  )}
                </div>
                <div className="distribution-legend">
                  {statusTotals.map((row) => (
                    <div key={row.slug}>
                      <span
                        className="legend-swatch"
                        style={{ background: row.color }}
                      />
                      <span>{row.name}</span>
                      <strong>{row.count}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="empty-inline">
                Task statuses will appear after a project board is initialized.
              </p>
            )}
          </article>

          <div className="section-title-row">
            <div>
              <span className="eyebrow">FOCUS AREAS</span>
              <h2>
                Active projects{" "}
                <span className="soft-count">{activeProjects.length}</span>
              </h2>
            </div>
            <Link className="text-link" href={`/${slug}/projects`}>
              See all projects <Icon name="arrow-right" size={16} />
            </Link>
          </div>
          <div className="project-preview-grid">
            {activeProjects.slice(0, 3).map((project) => (
              <ProjectPreviewCard
                key={project.id}
                project={project}
                taskItems={overview.tasks}
                slug={slug}
              />
            ))}
            {!activeProjects.length && (
              <div className="empty-card">
                <span className="empty-icon">
                  <Icon name="folder" size={20} />
                </span>
                <h3>No active projects</h3>
                <p>Create a project to organize your team’s work.</p>
                <Link
                  className="button button-primary"
                  href={`/${slug}/projects`}
                >
                  View projects
                </Link>
              </div>
            )}
          </div>

          <article className="panel assigned-panel" id="my-tasks">
            <div className="panel-heading compact-panel-heading">
              <div>
                <span className="eyebrow">YOUR NEXT MOVES</span>
                <h2>
                  Assigned to you{" "}
                  <span className="soft-count blue-count">
                    {myTasks.length}
                  </span>
                </h2>
              </div>
              <Link
                className="icon-button subtle"
                href={`/${slug}/projects`}
                aria-label="Find tasks"
              >
                <Icon name="filter" size={17} />
              </Link>
            </div>
            <div className="task-list">
              {myTasks.map(({ task, project }) => (
                <Link
                  className="assigned-task-row"
                  href={taskHref(slug, project.id, task.id)}
                  key={task.id}
                >
                  <span className="task-square" />
                  <span className="task-list-key">
                    #{task.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="task-list-title">{task.title}</span>
                  <span
                    className={`priority-label priority-${task.priority.toLowerCase()}`}
                  >
                    {priorityText(task.priority)}
                  </span>
                  <span className="status-label">
                    <i style={{ background: task.status?.color }} />
                    {task.status?.name ?? "Unknown"}
                  </span>
                  <span
                    className={`due-label ${task.priority === "URGENT" ? "is-urgent" : ""}`}
                  >
                    <Icon name="calendar" size={14} />
                    {formatShortDate(task.dueDate)}
                  </span>
                  <span
                    className="project-mini-dot blue"
                    title={project.name}
                  />
                </Link>
              ))}
              {!myTasks.length && (
                <p className="empty-state">
                  You have no open tasks assigned right now.
                </p>
              )}
            </div>
            <Link href={`/${slug}/projects`} className="panel-bottom-link">
              Open project boards <Icon name="arrow-right" size={15} />
            </Link>
          </article>
        </div>

        <aside className="dashboard-aside-column">
          <article className="panel deadlines-panel">
            <div className="panel-heading compact-panel-heading">
              <div>
                <span className="eyebrow">COMING UP</span>
                <h2>Near-term deadlines</h2>
              </div>
              <span className="panel-heading-icon">
                <Icon name="calendar" size={16} />
              </span>
            </div>
            <div className="deadline-list">
              {upcomingTasks.map(({ task, project }) => (
                <Link
                  className="deadline-item"
                  href={taskHref(slug, project.id, task.id)}
                  key={task.id}
                >
                  <span
                    className={`deadline-marker ${task.priority === "URGENT" ? "urgent" : task.priority === "HIGH" ? "high" : "normal"}`}
                  />
                  <span className="deadline-content">
                    <strong>{task.title}</strong>
                    <small>
                      <span>{project.name}</span>
                      <span>·</span>
                      {task.assignee?.name ?? "Unassigned"}
                    </small>
                  </span>
                  <time>{formatShortDate(task.dueDate)}</time>
                </Link>
              ))}
              {!upcomingTasks.length && (
                <p className="empty-inline">No upcoming task deadlines.</p>
              )}
            </div>
            <Link className="panel-bottom-link" href={`/${slug}/projects`}>
              View project boards <Icon name="arrow-right" size={15} />
            </Link>
          </article>

          <article className="panel activity-panel">
            <div className="panel-heading compact-panel-heading">
              <div>
                <span className="eyebrow">LATEST UPDATES</span>
                <h2>Team activity</h2>
              </div>
              <span className="activity-live">
                <i /> Live
              </span>
            </div>
            <div className="activity-list">
              <ActivityTimeline
                workspaceId={workspace.id}
                workspaceSlug={slug}
                limit={5}
                emptyMessage="Workspace activity will appear here as your team works."
              />
            </div>
            <Link className="panel-bottom-link" href={`/${slug}/activity`}>
              Open activity inbox <Icon name="arrow-right" size={15} />
            </Link>
          </article>

          <article className="panel team-panel">
            <div className="panel-heading compact-panel-heading">
              <div>
                <span className="eyebrow">PEOPLE</span>
                <h2>Workspace team</h2>
              </div>
              <Link href={`/${slug}/members`} className="quiet-action">
                Manage
              </Link>
            </div>
            <div className="team-preview-list">
              {members.slice(0, 4).map((member) => (
                <div className="team-person" key={member.id}>
                  <MemberAvatar name={member.name} />
                  <span>
                    <strong>{member.name}</strong>
                    <small>
                      {member.role === "OWNER"
                        ? "Workspace owner"
                        : member.role.toLowerCase()}
                    </small>
                  </span>
                  <span
                    className={`online-indicator ${member.isActive ? "" : "is-inactive"}`}
                  />
                </div>
              ))}
            </div>
            {membersQuery.isError && (
              <p className="empty-inline" role="alert">
                Workspace members could not be loaded.
              </p>
            )}
            <div className="team-footer">
              <div className="avatar-stack">
                {members.slice(0, 5).map((member) => (
                  <MemberAvatar key={member.id} name={member.name} />
                ))}
                {members.length > 5 && (
                  <span className="avatar-overflow">+{members.length - 5}</span>
                )}
              </div>
              <span>{members.length} teammates</span>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  accent,
  trend,
}: {
  label: string;
  value: string;
  detail: string;
  icon: "folder" | "check-circle" | "target" | "users";
  accent: string;
  trend: string;
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${accent}`}>
        <Icon name={icon} size={19} />
      </div>
      <span className="metric-label">{label}</span>
      <div className="metric-value-row">
        <strong>{value}</strong>
        <span className={`metric-trend ${accent}`}>{trend}</span>
      </div>
      <p>{detail}</p>
      <div className={`metric-sparkline ${accent}`}>
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </article>
  );
}

function ProjectPreviewCard({
  project,
  taskItems,
  slug,
}: {
  project: WorkspaceTaskOverview["projects"][number];
  taskItems: WorkspaceTaskOverview["tasks"];
  slug: string;
}) {
  const tasks = taskItems.filter(
    (item) => item.project.id === project.id && !item.task.parentTaskId,
  );
  const completed = tasks.filter(
    (item) => item.task.status?.isCompleted,
  ).length;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;
  const contributors = [
    ...new Set(
      tasks
        .map((item) => item.task.assignee?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  ];
  return (
    <Link
      href={`/${slug}/projects/${project.id}/board`}
      className="project-preview-card"
    >
      <div className="project-card-head">
        <span className="project-icon-tile blue">
          <Icon name="folder" size={18} />
        </span>
        <span className="project-code">
          PRJ-{project.id.slice(0, 6).toUpperCase()}
        </span>
        <Icon name="arrow-up-right" size={16} />
      </div>
      <h3>{project.name}</h3>
      <p className="project-description">
        {project.description || "No project description yet."}
      </p>
      <div className="project-progress-copy">
        <span>Progress</span>
        <strong>
          {progress}%{" "}
          <small>
            ({completed}/{tasks.length})
          </small>
        </strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="project-card-footer">
        <div className="avatar-stack">
          {contributors.slice(0, 3).map((name) => (
            <MemberAvatar key={name} name={name} />
          ))}
          {contributors.length > 3 && (
            <span className="avatar-overflow">+{contributors.length - 3}</span>
          )}
        </div>
        <span className="project-due">
          <Icon name="calendar" size={14} />
          {formatShortDate(project.dueDate)}
        </span>
      </div>
    </Link>
  );
}

function MemberAvatar({ name }: { name: string }) {
  return (
    <span
      className="avatar avatar-sm"
      title={name}
      style={{ backgroundColor: avatarColor(name) }}
    >
      {name
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </span>
  );
}

function aggregateStatuses(overview: WorkspaceTaskOverview) {
  const rows = new Map<
    string,
    { slug: string; name: string; color: string; count: number }
  >();
  for (const status of overview.statuses) {
    const existing = rows.get(status.slug);
    if (existing) continue;
    rows.set(status.slug, {
      slug: status.slug,
      name: status.name,
      color: status.color,
      count: 0,
    });
  }
  for (const { task } of overview.tasks) {
    const status = task.status;
    if (status && rows.has(status.slug)) rows.get(status.slug)!.count += 1;
  }
  return [...rows.values()];
}

function taskHref(slug: string, projectId: string, taskId: string) {
  return `/${slug}/tasks/${encodeURIComponent(taskId)}?projectId=${encodeURIComponent(projectId)}`;
}

function isUnauthorized(error: unknown) {
  return (
    (error instanceof WorkspaceApiError ||
      error instanceof ProjectApiError ||
      error instanceof TaskApiError ||
      (error instanceof Error && "status" in error)) &&
    "status" in error &&
    error.status === 401
  );
}

function count(value: number) {
  return String(value).padStart(2, "0");
}
function priorityText(priority: string) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}
function formatShortDate(value: string | null) {
  if (!value) return "No date";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? "No date"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function avatarColor(name: string) {
  const colors = [
    "#2775a6",
    "#a45c46",
    "#6559a5",
    "#34836e",
    "#c17b30",
    "#bc6477",
  ];
  const value = [...name].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );
  return colors[value % colors.length];
}
