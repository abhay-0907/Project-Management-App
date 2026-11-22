"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/layout/dashboard-shell";
import { Icon } from "@/components/shared/icon";
import { demoMembers, demoStatuses, demoTasks, demoWorkspace, formatShortDate, getMember, getProject, getProjectProgress, getProjectTasks, getStatus, type DemoTask, type TaskPriority } from "@/features/dashboard/api/demo-data";

type Props = { projectId: string };

export function ProjectBoard({ projectId }: Props) {
  const params = useParams<{ workspaceSlug: string }>();
  const slug = params.workspaceSlug || demoWorkspace.slug;
  const project = getProject(projectId);
  const statuses = demoStatuses.filter((status) => status.projectId === project.id).sort((a, b) => a.position - b.position);
  const [tasks, setTasks] = useState<DemoTask[]>(() => getProjectTasks(project.id));
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterAssignee, setFilterAssignee] = useState("ALL");
  const [search, setSearch] = useState("");
  const [includeSubtasks, setIncludeSubtasks] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const projectTasks = tasks.filter((task) => includeSubtasks || !task.parentTaskId);
  const activeCount = tasks.filter((task) => !getStatus(task.statusId)?.isCompleted).length;
  const filteredTasks = useMemo(() => projectTasks
    .filter((task) => filterPriority === "ALL" || task.priority === filterPriority)
    .filter((task) => filterAssignee === "ALL" || task.assigneeId === filterAssignee)
    .filter((task) => !search.trim() || `${task.title} ${task.key} ${task.labels.join(" ")}`.toLowerCase().includes(search.trim().toLowerCase())),
  [filterAssignee, filterPriority, projectTasks, search]);

  function moveTask(taskId: string, statusId: string) {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, statusId, updatedAt: new Date().toISOString(), completedAt: demoStatuses.find((status) => status.id === statusId)?.isCompleted ? new Date().toISOString() : null } : task));
    const status = demoStatuses.find((item) => item.id === statusId);
    toast.success(`Moved to ${status?.name ?? "new status"}`);
  }

  return (
    <div className="board-page">
      <div className="project-breadcrumb"><Link href={`/${slug}/projects`}><Icon name="folder" size={15} /> Projects</Link><Icon name="chevron-right" size={14} /><span>{project.name}</span><Icon name="chevron-right" size={14} /><span className="crumb-current">Board</span></div>
      <section className="board-project-heading">
        <div className="board-project-title"><span className={`project-icon-tile ${project.accent}`}><Icon name={project.icon} size={20} /></span><div><span className="eyebrow">{project.code} <span className="eyebrow-separator">/</span> PROJECT</span><h1>{project.name}</h1><div className="board-title-meta"><span className={`project-status project-status-${project.status.toLowerCase()}`}><i />{projectStatusLabel(project.status)}</span><span className="meta-divider" /><span className="board-task-total">{activeCount} open tasks</span><span className="meta-divider" /><span className="board-due-date"><Icon name="calendar" size={14} /> Due {formatShortDate(project.dueDate)}</span></div></div></div>
        <div className="board-heading-actions"><div className="avatar-stack board-member-stack">{[...new Set(tasks.map((task) => task.assigneeId).filter(Boolean))].slice(0, 4).map((id) => <Avatar key={id} member={getMember(id)} size="sm" />)}<span className="avatar-overflow">+{demoMembers.length - 4}</span></div><button className="button button-secondary" onClick={() => toast.message("Share project", { description: "Project sharing links are not connected in this demo." })}><Icon name="user-plus" size={16} /> Share</button><button className="button button-dark" onClick={() => toast.message("New task", { description: "Use the New task button in the top bar to start a task draft." })}><Icon name="plus" size={16} /> New task</button></div>
      </section>
      <nav className="project-tab-nav" aria-label="Project sections"><Link href={`/${slug}/projects/${project.id}`}><Icon name="grid" size={16} /> Overview</Link><Link className="is-selected" href={`/${slug}/projects/${project.id}/board`}><Icon name="board" size={16} /> Board</Link><button onClick={() => toast.message("List view", { description: "List view is coming to this project." })}><Icon name="list" size={16} /> List</button><Link href={`/${slug}/members`}><Icon name="users" size={16} /> Members <span className="tab-count">{demoMembers.length}</span></Link><Link href={`/${slug}/projects/${project.id}/settings`}><Icon name="settings" size={16} /> Settings</Link></nav>

      <section className="board-toolbar">
        <div className="board-filter-row">
          <button className="filter-chip" onClick={() => toast.message("Columns are grouped by status")}><Icon name="board" size={15} /><span>Group:</span><strong>Status</strong><Icon name="chevron-down" size={13} /></button>
          <label className="filter-chip filter-chip-select"><span>Assignee:</span><select aria-label="Filter by assignee" value={filterAssignee} onChange={(event) => setFilterAssignee(event.target.value)}><option value="ALL">Everyone</option>{demoMembers.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select><Icon name="chevron-down" size={13} /></label>
          <label className="filter-chip filter-chip-select"><Icon name="flag" size={15} /><select aria-label="Filter by priority" value={filterPriority} onChange={(event) => setFilterPriority(event.target.value)}><option value="ALL">All priorities</option><option value="URGENT">Urgent</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select><Icon name="chevron-down" size={13} /></label>
          <button className="add-filter-button" onClick={() => { setFilterPriority("ALL"); setFilterAssignee("ALL"); toast.message("Filters cleared"); }}><Icon name="plus" size={15} /> Clear filters</button>
        </div>
        <div className="board-tools-right"><label className="board-search"><Icon name="search" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter by title or key" /></label><button className={`toggle-chip ${includeSubtasks ? "is-on" : ""}`} onClick={() => setIncludeSubtasks((value) => !value)}><span className="toggle-check">{includeSubtasks && <Icon name="check" size={12} />}</span>Subtasks</button><button className="icon-button subtle" aria-label="Board options" onClick={() => toast.message("Board options", { description: "Columns are based on this project’s configured statuses." })}><Icon name="sliders" size={17} /></button></div>
      </section>

      <section className="kanban-board" aria-label="Project task board">
        {statuses.map((status) => {
          const columnTasks = filteredTasks.filter((task) => task.statusId === status.id).sort((a, b) => a.position - b.position);
          return <div className="kanban-column" key={status.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (draggedTask) moveTask(draggedTask, status.id); setDraggedTask(null); }}>
            <div className="kanban-column-heading"><span className="column-status-dot" style={{ background: status.color }} /><h2>{status.name}</h2><span className="column-count">{columnTasks.length}</span><button className="tiny-icon-button" aria-label={`Add task to ${status.name}`} onClick={() => toast.message(`Add a task to ${status.name}`)}><Icon name="plus" size={16} /></button><button className="tiny-icon-button column-more" aria-label={`${status.name} options`} onClick={() => toast.message(`${status.name} column`, { description: "Status columns are configured per project." })}><Icon name="more" size={17} /></button></div>
            <div className="kanban-card-list">
              {columnTasks.map((task) => <BoardTaskCard key={task.id} task={task} statusColor={status.color} slug={slug} onDragStart={() => setDraggedTask(task.id)} />)}
              <button className="quick-add-task" onClick={() => toast.message(`Quick add to ${status.name}`, { description: "A task draft can be created from the top navigation." })}><Icon name="plus" size={16} /> Add task</button>
            </div>
          </div>;
        })}
      </section>
      <footer className="board-footer"><span><Icon name="activity" size={15} /> <strong>{getProjectProgress(project.id)}%</strong> project completion</span><span className="footer-dot" /><span>{tasks.length} tasks across {statuses.length} statuses</span><span className="board-shortcuts"><kbd>N</kbd> New task <kbd>F</kbd> Filter</span></footer>
    </div>
  );
}

function BoardTaskCard({ task, statusColor, slug, onDragStart }: { task: DemoTask; statusColor: string; slug: string; onDragStart: () => void }) {
  const router = useRouter();
  const assignee = getMember(task.assigneeId);
  const children = demoTasks.filter((item) => item.parentTaskId === task.id);
  const comments = task.id === "DS-82" ? 3 : task.id === "DS-94" ? 1 : 0;
  const attachments = task.id === "DS-82" ? 3 : 0;
  return <article className={`kanban-card priority-border-${task.priority.toLowerCase()}`} draggable onDragStart={onDragStart} onClick={() => router.push(`/${slug}/tasks/${task.id}`)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") router.push(`/${slug}/tasks/${task.id}`); }}>
    <div className="kanban-card-top"><span className="kanban-task-key"><i style={{ borderColor: statusColor }} />{task.key}</span><span className={`priority-dot-label priority-${task.priority.toLowerCase()}`}><Icon name={task.priority === "URGENT" ? "bolt" : "flag"} size={12} />{priorityTitle(task.priority)}</span></div>
    <h3>{task.title}</h3>
    {task.labels.length > 0 && <div className="task-labels">{task.labels.slice(0, 2).map((label) => <span key={label}>{label}</span>)}{task.labels.length > 2 && <span>+{task.labels.length - 2}</span>}</div>}
    <div className="kanban-card-footer"><span className="task-due"><Icon name="calendar" size={13} />{formatShortDate(task.dueDate)}</span><div className="task-card-meta">{children.length > 0 && <span><Icon name="check-circle" size={13} />{children.length}</span>}{comments > 0 && <span><Icon name="message" size={13} />{comments}</span>}{attachments > 0 && <span><Icon name="paperclip" size={13} />{attachments}</span>}{assignee && <Avatar member={assignee} size="sm" />}</div></div>
  </article>;
}

function priorityTitle(priority: TaskPriority) { return priority.charAt(0) + priority.slice(1).toLowerCase(); }
function projectStatusLabel(status: string) { return status === "ACTIVE" ? "In progress" : status === "ON_HOLD" ? "On hold" : status === "COMPLETED" ? "Completed" : "Archived"; }
