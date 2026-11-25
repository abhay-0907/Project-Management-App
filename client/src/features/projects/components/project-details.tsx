"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import type { ReactNode } from "react";
import { Icon } from "@/components/shared/icon";
import { formatShortDate } from "@/features/dashboard/api/demo-data";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { ProjectApiError, type ProjectStatus } from "../api/project.api";
import { useProject } from "../hooks/use-projects";
import { ActivityTimeline } from "@/features/activity-logs/components/activity-timeline";

export function ProjectDetails({ projectId }: { projectId: string }) {
  const params = useParams<{ workspaceSlug: string }>();
  const router = useRouter();
  const slug = params.workspaceSlug;
  const workspacesQuery = useWorkspaces();
  const workspace = workspacesQuery.data?.find((item) => item.slug === slug);
  const projectQuery = useProject(workspace?.id, projectId);
  const project = projectQuery.data;
  useEffect(() => {
    if (projectQuery.error instanceof ProjectApiError && projectQuery.error.status === 401) {
      router.replace("/login");
    }
  }, [projectQuery.error, router]);

  if (workspacesQuery.isPending || (workspace && projectQuery.isPending)) {
    return <main className="workspace-route-state" role="status"><span className="workspace-spinner" aria-hidden="true" /><p>Loading project…</p></main>;
  }
  if (!workspace) {
    return <ProjectMessage title="Workspace unavailable" message="We could not find this workspace in your account." action={<Link className="button button-primary" href="/workspaces">Choose a workspace</Link>} />;
  }
  if (projectQuery.isError || !project) {
    const message = projectQuery.error instanceof ProjectApiError
      ? projectQuery.error.message
      : "This project could not be found in the selected workspace.";
    return <ProjectMessage title="Project unavailable" message={message} action={<Link className="button button-secondary" href={`/${slug}/projects`}>Back to projects</Link>} />;
  }

  const code = projectCode(project.id);
  const accent = projectAccent(project.id);
  return (
    <div className="project-detail-page">
      <div className="project-breadcrumb">
        <Link href={`/${slug}/projects`}><Icon name="folder" size={15} /> Projects</Link>
        <Icon name="chevron-right" size={14} /><span>{project.name}</span>
      </div>

      <section className="project-detail-hero">
        <div className="project-detail-identity">
          <span className={`project-icon-tile project-icon-large ${accent}`}><Icon name="folder" size={23} /></span>
          <div>
            <span className="eyebrow">{code} · PROJECT</span>
            <h1>{project.name}</h1>
            <p>{project.description || "No description added yet."}</p>
            <div className="project-detail-meta">
              <ProjectStatus status={project.status} />
              <span><Icon name="calendar" size={14} /> {formatShortDate(project.startDate)} – {formatShortDate(project.dueDate)}</span>
              <span><Icon name="users" size={14} /> Created by {project.creator?.name ?? "a workspace member"}</span>
            </div>
          </div>
        </div>
        <div className="project-detail-actions">
          <Link className="button button-primary" href={`/${slug}/projects/${project.id}/board`}>
            <Icon name="board" size={16} /> Open board
          </Link>
          <button className="button button-secondary" onClick={() => void navigator.clipboard?.writeText(window.location.href).then(() => toast.success("Project link copied"), () => toast.message(window.location.href))}>
            <Icon name="link" size={16} /> Share
          </button>
          <Link className="icon-button framed-button" href={`/${slug}/projects/${project.id}/settings`} aria-label="Project settings"><Icon name="settings" size={17} /></Link>
        </div>
      </section>

      <nav className="project-tab-nav" aria-label="Project sections">
        <Link className="is-selected" href={`/${slug}/projects/${project.id}`}><Icon name="grid" size={16} /> Overview</Link>
        <Link href={`/${slug}/projects/${project.id}/board`}><Icon name="board" size={16} /> Board</Link>
        <button onClick={() => toast.message("List view is not connected yet") }><Icon name="list" size={16} /> List</button>
        <Link href={`/${slug}/members`}><Icon name="users" size={16} /> Members</Link>
        <Link href={`/${slug}/projects/${project.id}/settings`}><Icon name="settings" size={16} /> Settings</Link>
      </nav>

      <section className="project-stats-grid">
        <Stat label="Lifecycle" value={statusLabel(project.status)} caption="Current project status" icon="activity" tone="blue" />
        <Stat label="Created" value={formatDate(project.createdAt)} caption={project.creator?.name ?? "Workspace member"} icon="target" tone="green" />
        <Stat label="Last updated" value={formatDate(project.updatedAt)} caption="Project record" icon="check-circle" tone="violet" />
      </section>

      <section className="project-detail-grid">
        <article className="panel project-description-panel">
          <div className="panel-heading"><div><span className="eyebrow">PROJECT SUMMARY</span><h2>Project overview</h2></div><span className="project-code">{code}</span></div>
          <p className="project-long-description">{project.description || "Add a description in project settings to share more context with your team."}</p>
          <div className="project-date-cards">
            <div><span>Start date</span><strong><Icon name="calendar" size={15} />{formatShortDate(project.startDate)}</strong></div>
            <div><span>Target date</span><strong><Icon name="flag" size={15} />{formatShortDate(project.dueDate)}</strong></div>
            <div><span>Created by</span><strong><Icon name="users" size={15} />{project.creator?.name ?? "Workspace member"}</strong></div>
          </div>
        </article>
        <aside className="project-detail-aside">
          <article className="panel project-team-panel">
            <div className="panel-heading compact-panel-heading"><div><span className="eyebrow">TASK TRACKING</span><h2>Project work</h2></div><span className="panel-heading-icon"><Icon name="board" size={16} /></span></div>
            <p className="empty-inline">Project tasks and contributors will appear here when the task APIs are connected.</p>
          </article>
          <article className="panel project-activity-panel">
            <div className="panel-heading compact-panel-heading"><div><span className="eyebrow">RECENT CHANGES</span><h2>Project activity</h2></div></div>
            <ActivityTimeline workspaceId={workspace.id} workspaceSlug={slug} projectId={project.id} limit={8} emptyMessage="No project activity has been recorded yet." />
          </article>
        </aside>
      </section>

      <section className="project-task-preview panel">
        <div className="panel-heading compact-panel-heading"><div><span className="eyebrow">TASKS</span><h2>Project task list</h2></div></div>
        <div className="empty-inline">Task records are not available yet. This project is loaded from your workspace database.</div>
      </section>
    </div>
  );
}

function Stat({ label, value, caption, icon, tone }: { label: string; value: string; caption: string; icon: "activity" | "target" | "check-circle"; tone: string }) {
  return <article className="project-stat-card"><span className={`project-stat-icon ${tone}`}><Icon name={icon} size={17} /></span><span className="project-stat-label">{label}</span><strong>{value}</strong><small>{caption}</small></article>;
}

function ProjectStatus({ status }: { status: ProjectStatus }) {
  return <span className={`project-status project-status-${status.toLowerCase()}`}><i />{statusLabel(status)}</span>;
}

function statusLabel(status: ProjectStatus) {
  const labels: Record<ProjectStatus, string> = {
    ACTIVE: "In progress",
    ON_HOLD: "On hold",
    COMPLETED: "Completed",
    ARCHIVED: "Archived",
  };
  return labels[status];
}

function projectCode(id: string) {
  return `PRJ-${id.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

function projectAccent(id: string) {
  const accents = ["blue", "violet", "green", "amber"];
  return accents[id.charCodeAt(0) % accents.length];
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ProjectMessage({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <main className="workspace-route-state"><span className="empty-icon"><Icon name="folder" size={20} /></span><h1>{title}</h1><p>{message}</p>{action}</main>;
}
