"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/layout/dashboard-shell";
import { Icon } from "@/components/shared/icon";
import {
  demoActivity,
  demoMembers,
  demoProjects,
  demoTasks,
  demoWorkspace,
  formatShortDate,
  getMember,
  getProjectProgress,
  getProjectTasks,
  getStatus,
} from "@/features/dashboard/api/demo-data";

export function WorkspaceDashboard() {
  const params = useParams<{ workspaceSlug: string }>();
  const slug = params.workspaceSlug || demoWorkspace.slug;
  const [range, setRange] = useState("Last 30 days");
  const activeProjects = demoProjects.filter((project) => project.status === "ACTIVE");
  const allTasks = demoTasks.filter((task) => !task.parentTaskId);
  const completedTasks = allTasks.filter((task) => getStatus(task.statusId)?.isCompleted);
  const myTasks = allTasks.filter((task) => task.assigneeId === "u_elena" && !getStatus(task.statusId)?.isCompleted);
  const statuses = [
    { slug: "done", name: "Done", color: "#2676a6" },
    { slug: "in-review", name: "In review", color: "#8fb9df" },
    { slug: "in-progress", name: "In progress", color: "#6b9ff0" },
    { slug: "todo", name: "To do", color: "#ddb978" },
    { slug: "backlog", name: "Backlog", color: "#e6e1da" },
  ];
  const statusRows = statuses.map((status) => ({ ...status, count: allTasks.filter((task) => getStatus(task.statusId)?.slug === status.slug).length }));
  const statusTotal = statusRows.reduce((sum, row) => sum + row.count, 0) || 1;
  const statusTotals = statusRows.map((row) => ({ ...row, percent: Math.round((row.count / statusTotal) * 100) }));
  const upcomingTasks = [...allTasks]
    .filter((task) => task.dueDate && !getStatus(task.statusId)?.isCompleted)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 4);

  return (
    <div className="dashboard-page">
      <section className="welcome-row">
        <div>
          <div className="eyebrow welcome-eyebrow"><span className="live-dot" /> YOUR WORKSPACE · {demoWorkspace.name.toUpperCase()}</div>
          <h1>Good morning, Elena <span className="wave">✦</span></h1>
          <p className="page-subtitle">A clear view of the work moving across your team today.</p>
        </div>
        <div className="welcome-actions">
          <label className="select-with-icon"><Icon name="calendar" size={16} /><select aria-label="Date range" value={range} onChange={(event) => setRange(event.target.value)}><option>Last 7 days</option><option>Last 30 days</option><option>This quarter</option></select><Icon name="chevron-down" size={14} /></label>
          <button className="button button-secondary" onClick={() => toast.message("Invite a teammate", { description: "Invitations are managed from the Members page." })}><Icon name="user-plus" size={16} /> Invite people</button>
          <Link className="button button-dark" href={`/${slug}/projects`}><Icon name="chart" size={16} /> View projects <Icon name="arrow-right" size={15} /></Link>
        </div>
      </section>

      <section className="metric-grid" aria-label="Workspace summary">
        <MetricCard label="Active projects" value={activeProjects.length.toString().padStart(2, "0")} detail={`${demoProjects.filter((project) => project.status === "COMPLETED").length} completed`} icon="folder" accent="blue" trend="+1 this month" />
        <MetricCard label="Open tasks" value={allTasks.filter((task) => !getStatus(task.statusId)?.isCompleted).length.toString().padStart(2, "0")} detail={`${myTasks.length} assigned to you`} icon="check-circle" accent="violet" trend={`${allTasks.filter((task) => task.priority === "URGENT").length} urgent`} />
        <MetricCard label="Completed tasks" value={completedTasks.length.toString().padStart(2, "0")} detail="Across active projects" icon="target" accent="green" trend="On track" />
        <MetricCard label="Team members" value={demoMembers.length.toString().padStart(2, "0")} detail="Across this workspace" icon="users" accent="amber" trend="3 active today" />
      </section>

      <section className="dashboard-main-grid">
        <div className="dashboard-primary-column">
          <article className="panel delivery-panel">
            <div className="panel-heading">
              <div><span className="eyebrow">WORK IN MOTION</span><h2>Task distribution</h2><p>Tasks grouped by their current project status</p></div>
              <button className="period-chip" onClick={() => setRange(range === "Last 30 days" ? "Last 7 days" : "Last 30 days")}>{range}<Icon name="chevron-down" size={14} /></button>
            </div>
            <div className="distribution-bar" role="img" aria-label="Task distribution by status">{statusTotals.map((row) => <span key={row.slug} style={{ width: `${row.percent}%`, background: row.color }} />)}</div>
            <div className="distribution-legend">{statusTotals.map((row) => <div key={row.slug}><span className="legend-swatch" style={{ background: row.color }} /><span>{row.name}</span><strong>{row.count}</strong></div>)}</div>
          </article>

          <div className="section-title-row">
            <div><span className="eyebrow">FOCUS AREAS</span><h2>Active projects <span className="soft-count">{activeProjects.length}</span></h2></div>
            <Link className="text-link" href={`/${slug}/projects`}>See all projects <Icon name="arrow-right" size={16} /></Link>
          </div>
          <div className="project-preview-grid">
            {activeProjects.slice(0, 3).map((project) => <ProjectPreviewCard key={project.id} project={project} slug={slug} />)}
          </div>

          <article className="panel assigned-panel" id="my-tasks">
            <div className="panel-heading compact-panel-heading">
              <div><span className="eyebrow">YOUR NEXT MOVES</span><h2>Assigned to you <span className="soft-count blue-count">{myTasks.length}</span></h2></div>
              <button className="icon-button subtle" aria-label="Filter your tasks" onClick={() => toast.message("Showing open tasks assigned to Elena") }><Icon name="filter" size={17} /></button>
            </div>
            <div className="task-list">
              {myTasks.map((task) => {
                const project = demoProjects.find((item) => item.id === task.projectId)!;
                const status = getStatus(task.statusId)!;
                return <Link className="assigned-task-row" href={`/${slug}/tasks/${task.id}`} key={task.id}>
                  <span className="task-square" />
                  <span className="task-list-key">{task.key}</span>
                  <span className="task-list-title">{task.title}</span>
                  <span className={`priority-label priority-${task.priority.toLowerCase()}`}>{priorityText(task.priority)}</span>
                  <span className="status-label"><i style={{ background: status.color }} />{status.name}</span>
                  <span className={`due-label ${task.priority === "URGENT" ? "is-urgent" : ""}`}><Icon name="calendar" size={14} />{formatShortDate(task.dueDate)}</span>
                  <span className={`project-mini-dot ${project.accent}`} title={project.name} />
                </Link>;
              })}
              {!myTasks.length && <p className="empty-state">You’re all caught up. New assignments will show up here.</p>}
            </div>
            <Link href={`/${slug}/projects/${demoProjects[0].id}/board`} className="panel-bottom-link">Open your board <Icon name="arrow-right" size={15} /></Link>
          </article>
        </div>

        <aside className="dashboard-aside-column">
          <article className="panel deadlines-panel">
            <div className="panel-heading compact-panel-heading"><div><span className="eyebrow">COMING UP</span><h2>Near-term deadlines</h2></div><span className="panel-heading-icon"><Icon name="calendar" size={16} /></span></div>
            <div className="deadline-list">
              {upcomingTasks.map((task) => {
                const project = demoProjects.find((item) => item.id === task.projectId)!;
                return <Link className="deadline-item" href={`/${slug}/tasks/${task.id}`} key={task.id}>
                  <span className={`deadline-marker ${task.priority === "URGENT" ? "urgent" : task.priority === "HIGH" ? "high" : "normal"}`} />
                  <span className="deadline-content"><strong>{task.title}</strong><small><span>{project.code}</span><span>·</span>{getMember(task.assigneeId)?.name}</small></span>
                  <time>{formatShortDate(task.dueDate)}</time>
                </Link>;
              })}
            </div>
            <Link className="panel-bottom-link" href={`/${slug}/projects`}>View project schedule <Icon name="arrow-right" size={15} /></Link>
          </article>

          <article className="panel activity-panel">
            <div className="panel-heading compact-panel-heading"><div><span className="eyebrow">LATEST UPDATES</span><h2>Team activity</h2></div><span className="activity-live"><i /> Live</span></div>
            <div className="activity-list">
              {demoActivity.slice(0, 4).map((activity) => {
                const member = getMember(activity.actorId)!;
                return <div className="activity-item" key={activity.id}>
                  <Avatar member={member} size="sm" />
                  <div><p><strong>{member.name.split(" ")[0]}</strong> {activity.message}</p><time>{relativeTime(activity.createdAt)}</time></div>
                </div>;
              })}
            </div>
            <Link className="panel-bottom-link" href={`/${slug}/notifications`}>Open activity inbox <Icon name="arrow-right" size={15} /></Link>
          </article>

          <article className="panel team-panel">
            <div className="panel-heading compact-panel-heading"><div><span className="eyebrow">PEOPLE</span><h2>Workspace team</h2></div><Link href={`/${slug}/members`} className="quiet-action">Manage</Link></div>
            <div className="team-preview-list">{demoMembers.slice(0, 4).map((member) => <div className="team-person" key={member.id}><Avatar member={member} size="sm" /><span><strong>{member.name}</strong><small>{member.role === "OWNER" ? "Workspace owner" : member.role.toLowerCase()}</small></span><span className="online-indicator" /></div>)}</div>
            <div className="team-footer"><div className="avatar-stack">{demoMembers.slice(0, 5).map((member) => <Avatar key={member.id} member={member} size="sm" />)}<span className="avatar-overflow">+{demoMembers.length - 5}</span></div><span>{demoMembers.length} teammates</span></div>
          </article>
        </aside>
      </section>
    </div>
  );
}

function MetricCard({ label, value, detail, icon, accent, trend }: { label: string; value: string; detail: string; icon: "folder" | "check-circle" | "target" | "users"; accent: string; trend: string }) {
  return <article className="metric-card"><div className={`metric-icon ${accent}`}><Icon name={icon} size={19} /></div><span className="metric-label">{label}</span><div className="metric-value-row"><strong>{value}</strong><span className={`metric-trend ${accent}`}>{trend}</span></div><p>{detail}</p><div className={`metric-sparkline ${accent}`}><i /><i /><i /><i /><i /><i /><i /></div></article>;
}

function ProjectPreviewCard({ project, slug }: { project: typeof demoProjects[number]; slug: string }) {
  const tasks = getProjectTasks(project.id).filter((task) => !task.parentTaskId);
  const progress = getProjectProgress(project.id);
  const contributors = [...new Set(tasks.map((task) => task.assigneeId).filter(Boolean))] as string[];
  return <Link href={`/${slug}/projects/${project.id}/board`} className="project-preview-card">
    <div className="project-card-head"><span className={`project-icon-tile ${project.accent}`}><Icon name={project.icon} size={18} /></span><span className="project-code">{project.code}</span><button className="tiny-icon-button" aria-label="More project options" onClick={(event) => { event.preventDefault(); event.stopPropagation(); toast.message(project.name); }}><Icon name="more" size={16} /></button></div>
    <h3>{project.name}</h3><p className="project-description">{project.description}</p>
    <div className="project-progress-copy"><span>Progress</span><strong>{progress}% <small>({tasks.filter((task) => getStatus(task.statusId)?.isCompleted).length}/{tasks.length})</small></strong></div>
    <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
    <div className="project-card-footer"><div className="avatar-stack">{contributors.slice(0, 3).map((id) => <Avatar key={id} member={getMember(id)} size="sm" />)}{contributors.length > 3 && <span className="avatar-overflow">+{contributors.length - 3}</span>}</div><span className="project-due"><Icon name="calendar" size={14} />{formatShortDate(project.dueDate)}</span></div>
  </Link>;
}

function priorityText(priority: string) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

function relativeTime(date: string) {
  const diff = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60_000));
  if (diff < 60) return `${diff}m ago`;
  const hours = Math.round(diff / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
