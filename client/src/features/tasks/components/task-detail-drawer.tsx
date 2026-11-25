"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/shared/icon";
import { useProjectBoard } from "@/features/projects/hooks/use-project-board";
import { ProjectApiError } from "@/features/projects/api/project.api";
import { TaskApiError } from "../api/task.api";
import { useDeleteTask } from "../hooks/use-delete-task";
import { useTask } from "../hooks/use-task";
import { useUpdateTask } from "../hooks/use-update-task";
import type { TaskPriority, UpdateTaskInput } from "../types/task.types";
import { WorkspaceApiError } from "@/features/workspaces/api/workspace.api";
import { useWorkspaceMembers } from "@/features/workspaces/hooks/use-workspace-members";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { ActivityTimeline } from "@/features/activity-logs/components/activity-timeline";

type Props = { taskId: string; projectId?: string };

export function TaskDetailDrawer({ taskId, projectId }: Props) {
  const params = useParams<{ workspaceSlug: string }>();
  const router = useRouter();
  const slug = params.workspaceSlug;
  const [editingDetails, setEditingDetails] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [editError, setEditError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const workspacesQuery = useWorkspaces();
  const workspace = workspacesQuery.data?.find((item) => item.slug === slug);
  const boardQuery = useProjectBoard(workspace?.id, projectId ?? "");
  const taskQuery = useTask(workspace?.id, projectId ?? "", taskId);
  const membersQuery = useWorkspaceMembers(workspace?.id);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const project = boardQuery.data?.project;
  const task = taskQuery.data;
  const statuses = boardQuery.data?.columns ?? [];
  const allTasks = statuses.flatMap((column) => column.tasks);
  const subtasks = useMemo(
    () => allTasks.filter((item) => item.parentTaskId === taskId),
    [allTasks, taskId],
  );
  const canDelete = workspace?.role === "OWNER" || workspace?.role === "ADMIN";

  const closeDrawer = useCallback(() => {
    if (projectId) router.push(`/${slug}/projects/${projectId}/board`);
    else router.push(`/${slug}/projects`);
  }, [projectId, router, slug]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleteTask.isPending) {
        if (deleteOpen) setDeleteOpen(false);
        else closeDrawer();
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closeDrawer, deleteOpen, deleteTask.isPending]);

  useEffect(() => {
    if (
      [
        workspacesQuery.error,
        boardQuery.error,
        taskQuery.error,
        membersQuery.error,
        updateTask.error,
        deleteTask.error,
      ].some(isUnauthorized)
    )
      router.replace("/login");
  }, [
    boardQuery.error,
    deleteTask.error,
    membersQuery.error,
    router,
    taskQuery.error,
    updateTask.error,
    workspacesQuery.error,
  ]);

  async function updateField(input: UpdateTaskInput) {
    if (!workspace || !projectId) return;
    try {
      await updateTask.mutateAsync({
        workspaceId: workspace.id,
        projectId,
        taskId,
        input,
      });
      toast.success("Task updated");
    } catch (error) {
      toast.error(apiErrorMessage(error, "The task could not be updated."));
    }
  }

  async function saveDetails() {
    if (!task || !workspace || !projectId) return;
    setEditError("");
    try {
      await updateTask.mutateAsync({
        workspaceId: workspace.id,
        projectId,
        taskId,
        input: {
          title: titleDraft.trim(),
          description: descriptionDraft.trim() || null,
        },
      });
      toast.success("Task details saved");
      setEditingDetails(false);
    } catch (error) {
      setEditError(apiErrorMessage(error, "Task details could not be saved."));
    }
  }

  async function confirmDelete() {
    if (!workspace || !projectId) return;
    setDeleteError("");
    try {
      await deleteTask.mutateAsync({
        workspaceId: workspace.id,
        projectId,
        taskId,
      });
      toast.success("Task deleted");
      router.push(`/${slug}/projects/${projectId}/board`);
    } catch (error) {
      setDeleteError(apiErrorMessage(error, "The task could not be deleted."));
    }
  }

  if (!projectId)
    return (
      <DrawerMessage
        title="Project is missing"
        message="Open this task from its project board to load it from the server."
        onClose={closeDrawer}
      />
    );
  if (
    workspacesQuery.isPending ||
    (workspace && (boardQuery.isPending || taskQuery.isPending))
  ) {
    return <DrawerLoading onClose={closeDrawer} />;
  }
  if (workspacesQuery.isError || !workspace) {
    return (
      <DrawerMessage
        title="Workspace unavailable"
        message={
          workspacesQuery.error instanceof Error
            ? workspacesQuery.error.message
            : "This workspace could not be loaded."
        }
        onClose={closeDrawer}
      />
    );
  }
  if (boardQuery.isError || !project) {
    return (
      <DrawerMessage
        title="Board unavailable"
        message={apiErrorMessage(
          boardQuery.error,
          "This project board could not be loaded.",
        )}
        onClose={closeDrawer}
        onRetry={() => void boardQuery.refetch()}
      />
    );
  }
  if (taskQuery.isError || !task) {
    return (
      <DrawerMessage
        title="Task unavailable"
        message={apiErrorMessage(
          taskQuery.error,
          "This task could not be found in this project.",
        )}
        onClose={closeDrawer}
        onRetry={() => void taskQuery.refetch()}
      />
    );
  }

  const currentStatus =
    statuses.find((status) => status.id === task.statusId) ?? task.status;
  const parentTask = task.parentTask;
  const updatePending = updateTask.isPending;

  return (
    <div
      className="task-drawer-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleteTask.isPending)
          closeDrawer();
      }}
    >
      <section
        className="task-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-drawer-title"
      >
        <div className="drawer-topbar">
          <div className="drawer-breadcrumb">
            <Link href={`/${slug}/projects/${project.id}/board`}>
              {project.name}
            </Link>
            <Icon name="chevron-right" size={13} />
            <span className="drawer-task-key">
              #{task.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div className="drawer-toolbar-actions">
            <button
              className="icon-button subtle"
              onClick={() =>
                void navigator.clipboard?.writeText(window.location.href).then(
                  () => toast.success("Task link copied"),
                  () => toast.error("Could not copy the task link"),
                )
              }
              aria-label="Copy task link"
            >
              <Icon name="link" size={17} />
            </button>
            {canDelete && (
              <button
                className="icon-button subtle task-delete-trigger"
                onClick={() => {
                  setDeleteError("");
                  setDeleteOpen(true);
                }}
                aria-label="Delete task"
              >
                <Icon name="trash" size={17} />
              </button>
            )}
            <span className="toolbar-divider" />
            <button
              className="icon-button close-drawer"
              onClick={closeDrawer}
              aria-label="Close task"
            >
              <Icon name="close" size={19} />
            </button>
          </div>
        </div>

        <div className="drawer-scroll-content">
          <div className="drawer-project-context">
            <span className="project-mini-icon">
              <Icon name="folder" size={15} />
            </span>
            <span>{project.name}</span>
            <span className="context-slash">/</span>
            <span className="context-section">Task details</span>
          </div>
          <div className="drawer-task-heading">
            <span className="eyebrow drawer-eyebrow">
              <i style={{ background: currentStatus?.color }} />
              {currentStatus?.name ?? "Task"} <span>·</span> #
              {task.id.slice(0, 8).toUpperCase()}
            </span>
            {editingDetails ? (
              <input
                id="task-drawer-title"
                className="task-title-editor"
                aria-label="Task title"
                value={titleDraft}
                maxLength={255}
                onChange={(event) => setTitleDraft(event.target.value)}
              />
            ) : (
              <h1 id="task-drawer-title">{task.title}</h1>
            )}
            <p>
              Created by {task.creator.name} <span>·</span>{" "}
              {formatDateTime(task.createdAt)}
            </p>
          </div>

          <div className="task-property-bar">
            <label className="task-property status-property">
              <span
                className="property-dot"
                style={{ background: currentStatus?.color }}
              />
              <select
                aria-label="Task status"
                value={task.statusId}
                onChange={(event) =>
                  void updateField({ statusId: event.target.value })
                }
                disabled={updatePending || statuses.length === 0}
              >
                <option value={task.statusId}>
                  {currentStatus?.name ?? "Current status"}
                </option>
                {statuses
                  .filter((status) => status.id !== task.statusId)
                  .map((status) => (
                    <option value={status.id} key={status.id}>
                      {status.name}
                    </option>
                  ))}
              </select>
              <Icon name="chevron-down" size={13} />
            </label>
            <label
              className={`task-property priority-property priority-${task.priority.toLowerCase()}`}
            >
              <Icon name="flag" size={14} />
              <select
                aria-label="Task priority"
                value={task.priority}
                onChange={(event) =>
                  void updateField({
                    priority: event.target.value as TaskPriority,
                  })
                }
                disabled={updatePending}
              >
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <Icon name="chevron-down" size={13} />
            </label>
            <label className="task-property assignee-property">
              <TaskAvatar name={task.assignee?.name} />
              <select
                aria-label="Task assignee"
                value={task.assigneeId ?? ""}
                onChange={(event) =>
                  void updateField({ assigneeId: event.target.value || null })
                }
                disabled={
                  updatePending ||
                  membersQuery.isPending ||
                  membersQuery.isError
                }
              >
                <option value="">Unassigned</option>
                {task.assigneeId &&
                  membersQuery.data?.some(
                    (member) =>
                      member.id === task.assigneeId && !member.isActive,
                  ) && (
                    <option value={task.assigneeId} disabled>
                      {task.assignee?.name ?? "Inactive member"} (inactive)
                    </option>
                  )}
                {membersQuery.data
                  ?.filter((member) => member.isActive)
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
              </select>
              <Icon name="chevron-down" size={13} />
            </label>
            <label className="task-property due-property">
              <Icon name="calendar" size={15} />
              <input
                type="date"
                aria-label="Task due date"
                value={task.dueDate ?? ""}
                onChange={(event) =>
                  void updateField({ dueDate: event.target.value || null })
                }
                disabled={updatePending}
              />
            </label>
          </div>
          {membersQuery.isError && (
            <p className="drawer-inline-error" role="alert">
              Workspace members could not be loaded, so assignment is
              unavailable.
            </p>
          )}
          {membersQuery.isPending && (
            <p className="form-hint">Loading workspace members…</p>
          )}

          <div className="drawer-content-grid">
            <div className="drawer-main-column">
              <section className="drawer-section description-section">
                <div className="drawer-section-heading">
                  <div>
                    <span className="eyebrow">OVERVIEW</span>
                    <h2>Description</h2>
                  </div>
                  <button
                    className="quiet-action"
                    type="button"
                    onClick={() => {
                      if (editingDetails) void saveDetails();
                      else {
                        setTitleDraft(task.title);
                        setDescriptionDraft(task.description ?? "");
                        setEditError("");
                        setEditingDetails(true);
                      }
                    }}
                    disabled={updatePending}
                  >
                    <Icon name={editingDetails ? "check" : "edit"} size={14} />
                    {editingDetails ? "Save" : "Edit"}
                  </button>
                </div>
                {editingDetails ? (
                  <textarea
                    className="description-editor"
                    rows={5}
                    value={descriptionDraft}
                    maxLength={20_000}
                    onChange={(event) =>
                      setDescriptionDraft(event.target.value)
                    }
                  />
                ) : (
                  <p className="task-description-text">
                    {task.description ||
                      "Add a description to give your team more context."}
                  </p>
                )}
                {editingDetails && (
                  <div className="description-edit-actions">
                    <button
                      className="button button-quiet"
                      type="button"
                      onClick={() => {
                        setEditingDetails(false);
                        setEditError("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {editError && (
                  <p className="drawer-inline-error" role="alert">
                    {editError}
                  </p>
                )}
              </section>

              <section className="drawer-section subtasks-section">
                <div className="drawer-section-heading">
                  <div>
                    <span className="eyebrow">BREAKDOWN</span>
                    <h2>
                      Subtasks{" "}
                      <span className="soft-count">{task.subtaskCount}</span>
                    </h2>
                  </div>
                </div>
                {subtasks.length > 0 ? (
                  subtasks.map((child) => (
                    <Link
                      href={taskHref(slug, project.id, child.id)}
                      className="subtask-row"
                      key={child.id}
                    >
                      <span
                        className={`subtask-check ${child.status?.isCompleted ? "completed" : ""}`}
                      >
                        {child.status?.isCompleted && (
                          <Icon name="check" size={12} />
                        )}
                      </span>
                      <span className="subtask-key">
                        #{child.id.slice(0, 8).toUpperCase()}
                      </span>
                      <strong>{child.title}</strong>
                      <span className="subtask-status">
                        <i style={{ background: child.status?.color }} />
                        {child.status?.name}
                      </span>
                      <TaskAvatar name={child.assignee?.name} />
                    </Link>
                  ))
                ) : (
                  <p className="empty-inline">No subtasks yet.</p>
                )}
              </section>

              <section className="drawer-section attachments-section">
                <div className="drawer-section-heading">
                  <div>
                    <span className="eyebrow">REFERENCE</span>
                    <h2>Attachments</h2>
                  </div>
                </div>
                <p className="empty-inline">
                  Attachments are not available for tasks yet.
                </p>
              </section>
            </div>

            <aside className="drawer-side-column">
              <section className="drawer-details-card">
                <div className="drawer-side-title">
                  <span className="eyebrow">DETAILS</span>
                </div>
                <div className="detail-field">
                  <span>Assignee</span>
                  <span className="detail-value">
                    <TaskAvatar name={task.assignee?.name} />
                    {task.assignee?.name ?? "Unassigned"}
                  </span>
                </div>
                <div className="detail-field">
                  <span>Priority</span>
                  <span
                    className={`priority-label priority-${task.priority.toLowerCase()}`}
                  >
                    <i className="priority-tiny-dot" />
                    {priorityTitle(task.priority)}
                  </span>
                </div>
                <div className="detail-field">
                  <span>Due date</span>
                  <span className="detail-value">
                    <Icon name="calendar" size={14} />
                    {formatDate(task.dueDate)}
                  </span>
                </div>
                <div className="detail-field">
                  <span>Project</span>
                  <Link
                    className="detail-project-link"
                    href={`/${slug}/projects/${project.id}`}
                  >
                    <span className="project-mini-icon">
                      <Icon name="folder" size={13} />
                    </span>
                    {project.name}
                  </Link>
                </div>
                <div className="detail-field">
                  <span>Updated</span>
                  <span className="detail-value">
                    {formatDate(task.updatedAt)}
                  </span>
                </div>
                <div className="detail-field">
                  <span>Parent task</span>
                  {parentTask ? (
                    <Link
                      className="detail-project-link"
                      href={taskHref(slug, project.id, parentTask.id)}
                    >
                      {parentTask.title}
                      <Icon name="arrow-up-right" size={13} />
                    </Link>
                  ) : (
                    <span className="detail-muted">None</span>
                  )}
                </div>
              </section>
              <section className="drawer-activity-card">
                <div className="drawer-tabs">
                  <span className="is-active">Activity</span>
                </div>
                <ActivityTimeline
                  workspaceId={workspace?.id}
                  workspaceSlug={slug}
                  projectId={projectId}
                  taskId={taskId}
                  limit={20}
                  emptyMessage="No changes have been recorded for this task yet."
                />
              </section>
            </aside>
          </div>
        </div>
        <footer className="drawer-footer">
          <span className="autosave-dot" />
          <span>Changes are saved after the server confirms them</span>
          <span className="drawer-key-hint">
            Press <kbd>Esc</kbd> to close
          </span>
        </footer>
      </section>
      {deleteOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleteTask.isPending)
              setDeleteOpen(false);
          }}
        >
          <section
            className="modal-card task-delete-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">REMOVE TASK</span>
                <h2 id="delete-task-title">Delete this task?</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleteTask.isPending}
                aria-label="Close"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="modal-form">
              <p>
                This permanently deletes “{task.title}”. This action cannot be
                undone.
              </p>
              {deleteError && (
                <p className="workspace-form-alert" role="alert">
                  {deleteError}
                </p>
              )}
              <div className="modal-footer">
                <button
                  className="button button-quiet"
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  disabled={deleteTask.isPending}
                >
                  Cancel
                </button>
                <button
                  className="button button-danger"
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={deleteTask.isPending}
                >
                  {deleteTask.isPending ? "Deleting…" : "Delete task"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function DrawerLoading({ onClose }: { onClose: () => void }) {
  return (
    <div className="task-drawer-backdrop">
      <section className="task-drawer task-drawer-not-found" role="status">
        <span className="workspace-spinner" />
        <p>Loading task…</p>
        <button className="button button-quiet" type="button" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
}

function DrawerMessage({
  title,
  message,
  onClose,
  onRetry,
}: {
  title: string;
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}) {
  return (
    <div className="task-drawer-backdrop">
      <section className="task-drawer task-drawer-not-found" role="alert">
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close task"
        >
          <Icon name="close" />
        </button>
        <div className="empty-icon">
          <Icon name="check-circle" size={20} />
        </div>
        <h2>{title}</h2>
        <p>{message}</p>
        {onRetry && (
          <button
            className="button button-secondary"
            type="button"
            onClick={onRetry}
          >
            Try again
          </button>
        )}
        <button
          className="button button-primary"
          type="button"
          onClick={onClose}
        >
          Back to board
        </button>
      </section>
    </div>
  );
}

function TaskAvatar({ name }: { name?: string | null }) {
  if (!name) return <span className="avatar avatar-sm avatar-empty">?</span>;
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

function apiErrorMessage(error: unknown, fallback: string) {
  if (
    error instanceof TaskApiError ||
    error instanceof WorkspaceApiError ||
    error instanceof ProjectApiError
  )
    return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function isUnauthorized(error: unknown) {
  return (
    (error instanceof WorkspaceApiError ||
      error instanceof TaskApiError ||
      error instanceof ProjectApiError) &&
    error.status === 401
  );
}

function taskHref(slug: string, projectId: string, taskId: string) {
  return `/${slug}/tasks/${encodeURIComponent(taskId)}?projectId=${encodeURIComponent(projectId)}`;
}

function formatDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "No due date"
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
}

function priorityTitle(priority: string) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
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
