"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/shared/icon";
import { TaskApiError } from "@/features/tasks/api/task.api";
import { TaskCreateDialog } from "@/features/tasks/components/task-create-dialog";
import { taskPriorityValues } from "@/features/tasks/types/task.types";
import type { TaskRecord, TaskStatus } from "@/features/tasks/types/task.types";
import type { ProjectBoardColumn } from "../types/project-board.types";
import { useProjectBoard } from "../hooks/use-project-board";
import { useCreateBoardColumn, useDeleteBoardColumn, useUpdateBoardColumn } from "../hooks/use-board-columns";
import { WorkspaceApiError } from "@/features/workspaces/api/workspace.api";
import { useWorkspaceMembers } from "@/features/workspaces/hooks/use-workspace-members";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { ProjectApiError, type ProjectStatus } from "../api/project.api";

type Props = { projectId: string };

export function ProjectBoard({ projectId }: Props) {
  const params = useParams<{ workspaceSlug: string }>();
  const router = useRouter();
  const slug = params.workspaceSlug;
  const [createStatusId, setCreateStatusId] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [includeSubtasks, setIncludeSubtasks] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ProjectBoardColumn | null | undefined>(undefined);
  const [deletingColumn, setDeletingColumn] = useState<ProjectBoardColumn | null>(null);

  const workspacesQuery = useWorkspaces();
  const workspace = workspacesQuery.data?.find((item) => item.slug === slug);
  const boardQuery = useProjectBoard(workspace?.id, projectId);
  const membersQuery = useWorkspaceMembers(workspace?.id);
  const updateColumn = useUpdateBoardColumn();
  const project = boardQuery.data?.project;
  const columns = boardQuery.data?.columns ?? [];
  const allTasks = columns.flatMap((column) => column.tasks);
  const visibleTasks = useMemo(() => allTasks
    .filter((task) => includeSubtasks || !task.parentTaskId)
    .filter((task) => priorityFilter === "ALL" || task.priority === priorityFilter)
    .filter((task) => assigneeFilter === "ALL" || task.assigneeId === assigneeFilter)
    .filter((task) => !search.trim() || `${task.title} ${task.id}`.toLowerCase().includes(search.trim().toLowerCase())),
  [allTasks, assigneeFilter, includeSubtasks, priorityFilter, search]);
  const canManageColumns = workspace?.role === "OWNER" || workspace?.role === "ADMIN";
  const createOpen = createStatusId !== null;

  useEffect(() => {
    if ([workspacesQuery.error, boardQuery.error, membersQuery.error, updateColumn.error].some(isUnauthorized)) {
      router.replace("/login");
    }
  }, [boardQuery.error, membersQuery.error, router, updateColumn.error, workspacesQuery.error]);

  async function reorderColumn(column: ProjectBoardColumn, position: number) {
    if (!workspace) return;
    try {
      await updateColumn.mutateAsync({
        workspaceId: workspace.id,
        projectId,
        statusId: column.id,
        input: { position },
      });
      toast.success(`Moved ${column.name}`);
    } catch (error) {
      toast.error(apiErrorMessage(error, "The column order could not be changed."));
    }
  }

  function openCreateTask(statusId?: string) {
    setCreateStatusId(statusId ?? "");
  }

  if (workspacesQuery.isPending || (workspace && boardQuery.isPending)) {
    return <main className="workspace-route-state" role="status"><span className="workspace-spinner" aria-hidden="true" /><p>Loading project…</p></main>;
  }
  if (workspacesQuery.isError) {
    return <BoardMessage title="Workspace unavailable" message={apiErrorMessage(workspacesQuery.error, "We could not load your workspaces.")} action={<Link className="button button-primary" href="/workspaces">Choose a workspace</Link>} />;
  }
  if (!workspace) {
    return <BoardMessage title="Workspace unavailable" message="We could not find this workspace in your account." action={<Link className="button button-primary" href="/workspaces">Choose a workspace</Link>} />;
  }
  if (boardQuery.isError || !project) {
    return <BoardMessage title="Board unavailable" message={apiErrorMessage(boardQuery.error, "This project board could not be loaded.")} action={<><button className="button button-secondary" type="button" onClick={() => void boardQuery.refetch()}>Try again</button><Link className="button button-quiet" href={`/${slug}/projects`}>Back to projects</Link></>} />;
  }

  const tasks = allTasks;
  const taskStatuses = columns;
  const activeCount = tasks.filter((task) => !task.status?.isCompleted && !task.parentTaskId).length;
  const completeCount = tasks.filter((task) => task.status?.isCompleted).length;
  const completion = tasks.length ? Math.round((completeCount / tasks.length) * 100) : 0;

  return (
    <div className="board-page">
      <div className="project-breadcrumb">
        <Link href={`/${slug}/projects`}><Icon name="folder" size={15} /> Projects</Link>
        <Icon name="chevron-right" size={14} />
        <span>{project.name}</span>
        <Icon name="chevron-right" size={14} />
        <span className="crumb-current">Board</span>
      </div>

      <section className="board-project-heading">
        <div className="board-project-title">
          <span className="project-icon-tile"><Icon name="folder" size={20} /></span>
          <div>
            <span className="eyebrow">PROJECT</span>
            <h1>{project.name}</h1>
            <div className="board-title-meta">
              <span className={`project-status project-status-${project.status.toLowerCase()}`}><i />{projectStatusLabel(project.status)}</span>
              <span className="meta-divider" />
              <span>{activeCount} open tasks</span>
              <span className="meta-divider" />
              <span className="board-due-date"><Icon name="calendar" size={14} /> Due {formatDate(project.dueDate)}</span>
            </div>
          </div>
        </div>
        <div className="board-header-actions">
          {canManageColumns && <button className="button button-secondary" type="button" onClick={() => setEditingColumn(null)}><Icon name="plus" size={16} /> Add column</button>}
          <button className="button button-dark" type="button" onClick={() => openCreateTask()}><Icon name="plus" size={16} /> New task</button>
        </div>
      </section>

      <nav className="project-tab-nav" aria-label="Project sections">
        <Link href={`/${slug}/projects/${project.id}`}><Icon name="grid" size={16} /> Overview</Link>
        <Link className={view === "board" ? "is-selected" : ""} href={`/${slug}/projects/${project.id}/board`} onClick={() => setView("board")}><Icon name="board" size={16} /> Board</Link>
        <button className={view === "list" ? "is-selected" : ""} type="button" onClick={() => setView("list")}><Icon name="list" size={16} /> List</button>
        <Link href={`/${slug}/members`}><Icon name="users" size={16} /> Members{membersQuery.data && <span className="tab-count">{membersQuery.data.length}</span>}</Link>
        <Link href={`/${slug}/projects/${project.id}/settings`}><Icon name="settings" size={16} /> Settings</Link>
      </nav>

      <section className="board-toolbar">
        <div className="board-filter-row">
          <label className="filter-chip filter-chip-select"><span>Assignee:</span><select aria-label="Filter by assignee" value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}><option value="ALL">Everyone</option>{membersQuery.data?.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select><Icon name="chevron-down" size={13} /></label>
          <label className="filter-chip filter-chip-select"><Icon name="flag" size={15} /><select aria-label="Filter by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="ALL">All priorities</option>{taskPriorityValues.map((priority) => <option key={priority} value={priority}>{priorityTitle(priority)}</option>)}</select><Icon name="chevron-down" size={13} /></label>
          <button className={`toggle-chip ${includeSubtasks ? "is-on" : ""}`} type="button" onClick={() => setIncludeSubtasks((value) => !value)}><span className="toggle-check">{includeSubtasks && <Icon name="check" size={12} />}</span>Subtasks</button>
        </div>
        <div className="board-tools-right">
          <label className="board-search"><Icon name="search" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" /></label>
          {(search || priorityFilter !== "ALL" || assigneeFilter !== "ALL" || includeSubtasks) && <button className="add-filter-button" type="button" onClick={() => { setSearch(""); setPriorityFilter("ALL"); setAssigneeFilter("ALL"); setIncludeSubtasks(false); }}>Clear filters</button>}
        </div>
      </section>

      {taskStatuses.length === 0 ? (
        <div className="board-state panel"><span className="board-empty-icon"><Icon name="board" size={23} /></span><h2>Start your task board</h2><p>Add a board column, or create a task to initialize the default workflow.</p><div className="board-empty-actions">{canManageColumns && <button className="button button-secondary" type="button" onClick={() => setEditingColumn(null)}><Icon name="plus" size={15} /> Add column</button>}<button className="button button-primary" type="button" onClick={() => openCreateTask()}><Icon name="plus" size={15} /> Create task</button></div></div>
      ) : view === "board" ? (
        <section className="kanban-board" aria-label="Project task board">
          {taskStatuses.map((status) => {
            const columnTasks = visibleTasks.filter((task) => task.statusId === status.id).sort((a, b) => a.position - b.position);
            return <div className="kanban-column" key={status.id}>
              <div className="kanban-column-heading"><span className="column-status-dot" style={{ background: status.color }} /><h2>{status.name}</h2><span className="column-count">{columnTasks.length}</span><button className="tiny-icon-button" type="button" aria-label={`Add task to ${status.name}`} onClick={() => openCreateTask(status.id)}><Icon name="plus" size={16} /></button>{canManageColumns && <div className="column-actions"><button className="tiny-icon-button" type="button" aria-label={`Move ${status.name} left`} title="Move left" disabled={status.position === 0 || updateColumn.isPending} onClick={() => void reorderColumn(status, status.position - 1)}>←</button><button className="tiny-icon-button" type="button" aria-label={`Move ${status.name} right`} title="Move right" disabled={status.position === taskStatuses.length - 1 || updateColumn.isPending} onClick={() => void reorderColumn(status, status.position + 1)}>→</button><button className="tiny-icon-button" type="button" aria-label={`Edit ${status.name}`} title="Edit column" onClick={() => setEditingColumn(status)}><Icon name="edit" size={14} /></button><button className="tiny-icon-button column-delete-action" type="button" aria-label={`Delete ${status.name}`} title="Delete column" onClick={() => setDeletingColumn(status)}><Icon name="trash" size={14} /></button></div>}</div>
              <div className="kanban-card-list">
                {columnTasks.map((task) => <BoardTaskCard key={task.id} task={task} status={status} slug={slug} projectId={project.id} />)}
                {columnTasks.length === 0 && <p className="empty-inline">No tasks in this status.</p>}
              </div>
            </div>;
          })}
        </section>
      ) : (
        <section className="projects-table-wrap task-list-table-wrap">
          <table className="projects-table"><thead><tr><th>Task</th><th>Status</th><th>Assignee</th><th>Priority</th><th>Due date</th></tr></thead><tbody>
            {visibleTasks.map((task) => <tr key={task.id}><td><Link className="task-table-link" href={taskHref(slug, project.id, task.id)}><strong>{task.title}</strong><small>#{task.id.slice(0, 8).toUpperCase()}</small></Link></td><td><span className="task-table-status"><i style={{ background: task.status?.color }} />{task.status?.name ?? "Unknown"}</span></td><td>{task.assignee?.name ?? "Unassigned"}</td><td><span className={`priority-label priority-${task.priority.toLowerCase()}`}>{priorityTitle(task.priority)}</span></td><td>{formatDate(task.dueDate)}</td></tr>)}
          </tbody></table>
          {!visibleTasks.length && <div className="empty-inline centered-empty">No tasks match these filters.</div>}
        </section>
      )}

      {!boardQuery.isPending && !boardQuery.isError && taskStatuses.length > 0 && !visibleTasks.length && allTasks.length === 0 && <div className="board-first-task"><span className="eyebrow">YOUR BOARD IS READY</span><p>Add the first task to start moving work through this project.</p><button className="button button-primary" type="button" onClick={() => openCreateTask()}><Icon name="plus" size={15} /> Create first task</button></div>}
      {!boardQuery.isPending && !boardQuery.isError && <footer className="board-footer"><span><Icon name="activity" size={15} /> <strong>{completion}%</strong> project completion</span><span className="footer-dot" /><span>{boardQuery.data?.totalTasks ?? allTasks.length} tasks across {taskStatuses.length} statuses</span></footer>}
      {createOpen && <TaskCreateDialog workspaceId={workspace.id} projectId={project.id} statusId={createStatusId || undefined} onClose={() => setCreateStatusId(null)} />}
      {editingColumn !== undefined && <BoardColumnDialog key={editingColumn?.id ?? "new-column"} workspaceId={workspace.id} projectId={project.id} column={editingColumn} mustBeDefault={taskStatuses.length === 0} onClose={() => setEditingColumn(undefined)} />}
      {deletingColumn && <DeleteBoardColumnDialog key={deletingColumn.id} workspaceId={workspace.id} projectId={project.id} column={deletingColumn} columns={taskStatuses} onClose={() => setDeletingColumn(null)} />}
    </div>
  );
}

function BoardTaskCard({ task, status, slug, projectId }: {
  task: TaskRecord;
  status: TaskStatus;
  slug: string;
  projectId: string;
}) {
  const assigneeName = task.assignee?.name;
  return (
    <Link className={`kanban-card priority-border-${task.priority.toLowerCase()}`} href={taskHref(slug, projectId, task.id)}>
      <div className="kanban-card-top"><span className="kanban-task-key"><i style={{ borderColor: status.color }} />#{task.id.slice(0, 8).toUpperCase()}</span><span className={`priority-dot-label priority-${task.priority.toLowerCase()}`}><Icon name={task.priority === "URGENT" ? "bolt" : "flag"} size={12} />{priorityTitle(task.priority)}</span></div>
      <h3>{task.title}</h3>
      {task.description && <p className="kanban-card-description">{task.description}</p>}
      <div className="kanban-card-footer"><span className="task-due"><Icon name="calendar" size={13} />{formatDate(task.dueDate)}</span><div className="task-card-meta">{assigneeName ? <TaskAvatar name={assigneeName} /> : <span className="task-unassigned">Unassigned</span>}</div></div>
    </Link>
  );
}

function BoardColumnDialog({ workspaceId, projectId, column, mustBeDefault, onClose }: {
  workspaceId: string;
  projectId: string;
  column: ProjectBoardColumn | null;
  mustBeDefault: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const createColumn = useCreateBoardColumn();
  const updateColumn = useUpdateBoardColumn();
  const [name, setName] = useState(column?.name ?? "");
  const [color, setColor] = useState(column?.color ?? "#94a3b8");
  const [isDefault, setIsDefault] = useState(column?.isDefault ?? mustBeDefault);
  const [isCompleted, setIsCompleted] = useState(column?.isCompleted ?? false);
  const [error, setError] = useState("");
  const pending = createColumn.isPending || updateColumn.isPending;

  useEffect(() => {
    if ([createColumn.error, updateColumn.error].some(isUnauthorized)) router.replace("/login");
  }, [createColumn.error, router, updateColumn.error]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      if (column) {
        await updateColumn.mutateAsync({
          workspaceId,
          projectId,
          statusId: column.id,
          input: { name: name.trim(), color, isDefault, isCompleted },
        });
        toast.success("Board column updated");
      } else {
        await createColumn.mutateAsync({
          workspaceId,
          projectId,
          input: { name: name.trim(), color, isDefault, isCompleted },
        });
        toast.success("Board column created");
      }
      onClose();
    } catch (cause) {
      setError(apiErrorMessage(cause, "The board column could not be saved."));
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !pending) onClose();
    }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="board-column-title">
        <div className="modal-heading"><div><span className="eyebrow">PROJECT WORKFLOW</span><h2 id="board-column-title">{column ? "Edit column" : "Add a column"}</h2></div><button className="icon-button" type="button" onClick={onClose} disabled={pending} aria-label="Close"><Icon name="close" /></button></div>
        <form className="modal-form" onSubmit={(event) => void submit(event)}>
          <label className="field-label">Column name<input autoFocus maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="For example, In Review" required /></label>
          <label className="field-label column-color-field">Column color<input aria-label="Column color" type="color" value={color} onChange={(event) => setColor(event.target.value)} /></label>
          <label className="board-column-checkbox"><input type="checkbox" checked={isDefault} disabled={Boolean(column?.isDefault) || mustBeDefault} onChange={(event) => setIsDefault(event.target.checked)} /><span><strong>Default for new tasks</strong><small>{mustBeDefault ? "The first board column must be the default." : "New tasks start in the default column."}</small></span></label>
          <label className="board-column-checkbox"><input type="checkbox" checked={isCompleted} onChange={(event) => setIsCompleted(event.target.checked)} /><span><strong>Completed status</strong><small>Tasks here count as complete.</small></span></label>
          {error && <p className="workspace-form-alert" role="alert">{error}</p>}
          <div className="modal-footer"><button className="button button-quiet" type="button" onClick={onClose} disabled={pending}>Cancel</button><button className="button button-primary" type="submit" disabled={pending || !name.trim()}>{pending ? "Saving…" : column ? "Save column" : "Create column"}</button></div>
        </form>
      </section>
    </div>
  );
}

function DeleteBoardColumnDialog({ workspaceId, projectId, column, columns, onClose }: {
  workspaceId: string;
  projectId: string;
  column: ProjectBoardColumn;
  columns: ProjectBoardColumn[];
  onClose: () => void;
}) {
  const router = useRouter();
  const deleteColumn = useDeleteBoardColumn();
  const destinations = columns.filter((candidate) => candidate.id !== column.id);
  const [destinationId, setDestinationId] = useState(destinations[0]?.id ?? "");
  const [error, setError] = useState("");
  const hasTasks = column.tasks.length > 0;

  useEffect(() => {
    if (isUnauthorized(deleteColumn.error)) router.replace("/login");
  }, [deleteColumn.error, router]);

  async function confirmDelete() {
    setError("");
    try {
      const result = await deleteColumn.mutateAsync({
        workspaceId,
        projectId,
        statusId: column.id,
        input: hasTasks ? { reassignToStatusId: destinationId } : {},
      });
      const destination = destinations.find((candidate) => candidate.id === result.reassignedToStatusId);
      toast.success(result.reassignedTaskCount
        ? `Column deleted; ${result.reassignedTaskCount} ${result.reassignedTaskCount === 1 ? "task" : "tasks"} moved to ${destination?.name ?? "another column"}`
        : "Board column deleted");
      onClose();
    } catch (cause) {
      setError(apiErrorMessage(cause, "The board column could not be deleted."));
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !deleteColumn.isPending) onClose();
    }}>
      <section className="modal-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-column-title">
        <div className="modal-heading"><div><span className="eyebrow">REMOVE COLUMN</span><h2 id="delete-column-title">Delete “{column.name}”?</h2></div><button className="icon-button" type="button" onClick={onClose} disabled={deleteColumn.isPending} aria-label="Close"><Icon name="close" /></button></div>
        <div className="modal-form">
          {hasTasks ? <><p>This column contains {column.tasks.length} {column.tasks.length === 1 ? "task" : "tasks"}. Choose where to move them before deleting it.</p><label className="field-label">Move tasks to<select value={destinationId} onChange={(event) => setDestinationId(event.target.value)} required>{destinations.map((destination) => <option key={destination.id} value={destination.id}>{destination.name}</option>)}</select></label></> : <p>This column is empty and will be removed from this project.</p>}
          {column.isDefault && <p className="form-hint">Another column will become the default for new tasks.</p>}
          {destinations.length === 0 && <p className="workspace-form-alert" role="alert">A board must keep at least one column.</p>}
          {error && <p className="workspace-form-alert" role="alert">{error}</p>}
          <div className="modal-footer"><button className="button button-quiet" type="button" onClick={onClose} disabled={deleteColumn.isPending}>Cancel</button><button className="button button-danger" type="button" onClick={() => void confirmDelete()} disabled={deleteColumn.isPending || destinations.length === 0 || (hasTasks && !destinationId)}>{deleteColumn.isPending ? "Deleting…" : "Delete column"}</button></div>
        </div>
      </section>
    </div>
  );
}

function TaskAvatar({ name }: { name: string }) {
  return <span className="avatar avatar-sm task-avatar" title={name} style={{ backgroundColor: avatarColor(name) }}>{name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>;
}

function BoardMessage({ title, message, action }: { title: string; message: string; action: ReactNode }) {
  return <main className="workspace-route-state"><span className="empty-icon"><Icon name="folder" size={20} /></span><h1>{title}</h1><p>{message}</p>{action}</main>;
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ProjectApiError || error instanceof WorkspaceApiError || error instanceof TaskApiError) return error.message;
  return fallback;
}

function isUnauthorized(error: unknown) {
  return (error instanceof WorkspaceApiError || error instanceof ProjectApiError || error instanceof TaskApiError) && error.status === 401;
}

function taskHref(slug: string, projectId: string, taskId: string) {
  return `/${slug}/tasks/${encodeURIComponent(taskId)}?projectId=${encodeURIComponent(projectId)}`;
}

function formatDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "No due date" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function priorityTitle(priority: string) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

function projectStatusLabel(status: ProjectStatus) {
  return status === "ACTIVE" ? "In progress" : status === "ON_HOLD" ? "On hold" : status === "COMPLETED" ? "Completed" : "Archived";
}

function avatarColor(name: string) {
  const colors = ["#2775a6", "#a45c46", "#6559a5", "#34836e", "#c17b30", "#bc6477"];
  const value = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return colors[value % colors.length];
}
