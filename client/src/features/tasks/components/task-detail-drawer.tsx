"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/layout/dashboard-shell";
import { Icon } from "@/components/shared/icon";
import { demoAttachments, demoComments, demoMembers, demoProjects, demoStatuses, demoTasks, demoWorkspace, formatFileSize, formatShortDate, getMember, getProject, getStatus, getTask, type DemoComment, type TaskPriority } from "@/features/dashboard/api/demo-data";

type Props = { taskId: string };

export function TaskDetailDrawer({ taskId }: Props) {
  const params = useParams<{ workspaceSlug: string }>();
  const router = useRouter();
  const slug = params.workspaceSlug || demoWorkspace.slug;
  const task = getTask(taskId);
  const [statusId, setStatusId] = useState(task?.statusId ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "MEDIUM");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [editingDescription, setEditingDescription] = useState(false);
  const [tab, setTab] = useState<"comments" | "activity">("comments");
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState<DemoComment[]>(() => demoComments.filter((comment) => comment.taskId === task?.id));

  const project = task ? getProject(task.projectId) : demoProjects[0];
  const statuses = demoStatuses.filter((status) => status.projectId === project.id).sort((a, b) => a.position - b.position);
  const children = task ? demoTasks.filter((item) => item.parentTaskId === task.id) : [];
  const attachments = task ? demoAttachments.filter((attachment) => attachment.taskId === task.id) : [];
  const comments = useMemo(() => [...localComments].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [localComments]);
  const currentStatus = statuses.find((status) => status.id === statusId);

  const closeDrawer = useCallback(() => {
    if (task) router.push(`/${slug}/projects/${task.projectId}/board`);
    else router.push(`/${slug}`);
  }, [router, slug, task]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") closeDrawer(); }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closeDrawer]);

  function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task || !commentText.trim()) return;
    setLocalComments((current) => [...current, { id: `local-${Date.now()}`, taskId: task.id, authorId: "u_elena", content: commentText.trim(), createdAt: new Date().toISOString() }]);
    setCommentText("");
    toast.success("Comment added to this demo task");
  }

  function saveDescription() {
    setEditingDescription(false);
    toast.success("Description saved for this session");
  }

  function copyLink() {
    void navigator.clipboard?.writeText(window.location.href).then(() => toast.success("Task link copied"), () => toast.message("Task link", { description: window.location.href }));
  }

  if (!task) return <div className="task-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDrawer(); }}><section className="task-drawer task-drawer-not-found"><button className="icon-button" onClick={closeDrawer} aria-label="Close task"><Icon name="close" /></button><div className="empty-icon"><Icon name="check-circle" size={20} /></div><h2>Task not found</h2><p>This task may have been removed or the link is incorrect.</p><Link className="button button-primary" href={`/${slug}/projects/${demoProjects[0].id}/board`}>Back to board</Link></section></div>;

  const parent = task.parentTaskId ? demoTasks.find((item) => item.id === task.parentTaskId) : undefined;
  return (
    <div className="task-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDrawer(); }}>
      <section className="task-drawer" role="dialog" aria-modal="true" aria-labelledby="task-drawer-title">
        <div className="drawer-topbar"><div className="drawer-breadcrumb"><Link href={`/${slug}/projects/${project.id}/board`}>{project.code}</Link><Icon name="chevron-right" size={13} /><span className="drawer-task-key">{task.key}</span>{parent && <><Icon name="chevron-right" size={13} /><span className="drawer-parent-link">Subtask of {parent.key}</span></>}</div><div className="drawer-toolbar-actions"><button className="icon-button subtle" onClick={copyLink} aria-label="Copy task link"><Icon name="link" size={17} /></button><button className="icon-button subtle" onClick={() => toast.message("Task expanded", { description: "This panel is already using the full task detail view." })} aria-label="Expand task"><Icon name="maximize" size={17} /></button><button className="icon-button subtle" onClick={() => toast.message("Watching task", { description: "You will see future updates in your notifications." })} aria-label="Watch task"><Icon name="bell" size={17} /></button><button className="icon-button subtle" onClick={() => toast.message("More task actions", { description: "Task actions are available in the project board." })} aria-label="More actions"><Icon name="more" size={18} /></button><span className="toolbar-divider" /><button className="icon-button close-drawer" onClick={closeDrawer} aria-label="Close task"><Icon name="close" size={19} /></button></div></div>

        <div className="drawer-scroll-content">
          <div className="drawer-project-context"><span className={`project-mini-icon ${project.accent}`}><Icon name={project.icon} size={15} /></span><span>{project.name}</span><span className="context-slash">/</span><span className="context-section">Task details</span></div>
          <div className="drawer-task-heading"><span className="eyebrow drawer-eyebrow"><i style={{ background: currentStatus?.color }} />{project.code} <span>·</span> {currentStatus?.name ?? "Task"}</span><h1 id="task-drawer-title">{task.title}</h1><p>{task.key} <span>·</span> Created by {getMember(task.createdBy)?.name ?? "Marcus Vance"}</p></div>

          <div className="task-property-bar">
            <label className="task-property status-property"><span className="property-dot" style={{ background: currentStatus?.color }} /><select aria-label="Task status" value={statusId} onChange={(event) => { setStatusId(event.target.value); toast.message(`Status changed to ${demoStatuses.find((status) => status.id === event.target.value)?.name}`); }}>{statuses.map((status) => <option value={status.id} key={status.id}>{status.name}</option>)}</select><Icon name="chevron-down" size={13} /></label>
            <label className={`task-property priority-property priority-${priority.toLowerCase()}`}><Icon name="flag" size={14} /><select aria-label="Task priority" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}><option value="URGENT">Urgent</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select><Icon name="chevron-down" size={13} /></label>
            <label className="task-property assignee-property"><Avatar member={getMember(assigneeId)} size="sm" /><select aria-label="Task assignee" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}><option value="">Unassigned</option>{demoMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select><Icon name="chevron-down" size={13} /></label>
            <label className="task-property due-property"><Icon name="calendar" size={15} /><input type="date" aria-label="Task due date" value={dueDate} onChange={(event) => { setDueDate(event.target.value); toast.message("Due date updated"); }} /></label>
          </div>

          <div className="drawer-content-grid">
            <div className="drawer-main-column">
              <section className="drawer-section description-section"><div className="drawer-section-heading"><div><span className="eyebrow">OVERVIEW</span><h2>Description</h2></div><button className="quiet-action" onClick={() => editingDescription ? saveDescription() : setEditingDescription(true)}><Icon name={editingDescription ? "check" : "edit"} size={14} />{editingDescription ? "Save" : "Edit"}</button></div>{editingDescription ? <textarea className="description-editor" rows={5} value={description} onChange={(event) => setDescription(event.target.value)} /> : <p className="task-description-text">{description || "Add a description to give your team more context."}</p>}
                <div className="task-labels drawer-labels">{task.labels.map((label) => <span key={label}>{label}</span>)}<button onClick={() => toast.message("Manage labels", { description: "Labels are shared across this workspace." })}><Icon name="plus" size={13} /> Add label</button></div>
              </section>

              {children.length > 0 && <section className="drawer-section subtasks-section"><div className="drawer-section-heading"><div><span className="eyebrow">BREAKDOWN</span><h2>Subtasks <span className="soft-count">{children.filter((item) => getStatus(item.statusId)?.isCompleted).length}/{children.length}</span></h2></div><button className="quiet-action" onClick={() => toast.message("Add a subtask", { description: "Subtasks use the same task fields as this task." })}><Icon name="plus" size={14} /> Add</button></div>{children.map((child) => <Link href={`/${slug}/tasks/${child.id}`} className="subtask-row" key={child.id}><span className={`subtask-check ${getStatus(child.statusId)?.isCompleted ? "completed" : ""}`}>{getStatus(child.statusId)?.isCompleted && <Icon name="check" size={12} />}</span><span className="subtask-key">{child.key}</span><strong>{child.title}</strong><span className="subtask-status"><i style={{ background: getStatus(child.statusId)?.color }} />{getStatus(child.statusId)?.name}</span><Avatar member={getMember(child.assigneeId)} size="sm" /></Link>)}</section>}

              <section className="drawer-section attachments-section"><div className="drawer-section-heading"><div><span className="eyebrow">REFERENCE</span><h2>Attachments <span className="soft-count">{attachments.length}</span></h2></div><button className="quiet-action" onClick={() => toast.message("Add an attachment", { description: "File uploads will be available when storage is connected." })}><Icon name="plus" size={14} /> Attach</button></div>{attachments.length ? <div className="attachment-list">{attachments.map((attachment) => <div className="attachment-row" key={attachment.id}><span className="attachment-file-icon"><Icon name="file" size={17} /></span><span className="attachment-copy"><strong>{attachment.fileName}</strong><small>{formatFileSize(attachment.fileSize)} · Added {formatShortDate(attachment.createdAt)}</small></span><button className="tiny-icon-button" aria-label={`Download ${attachment.fileName}`} onClick={() => toast.message("Attachment preview", { description: "The demo file is not stored on a server." })}><Icon name="download" size={15} /></button></div>)}</div> : <p className="empty-inline">No files attached yet.</p>}</section>
            </div>

            <aside className="drawer-side-column"><section className="drawer-details-card"><div className="drawer-side-title"><span className="eyebrow">DETAILS</span><button className="tiny-icon-button" aria-label="More details"><Icon name="more" size={16} /></button></div><div className="detail-field"><span>Assignee</span><span className="detail-value"><Avatar member={getMember(assigneeId)} size="sm" />{getMember(assigneeId)?.name ?? "Unassigned"}</span></div><div className="detail-field"><span>Priority</span><span className={`priority-label priority-${priority.toLowerCase()}`}><i className="priority-tiny-dot" />{priorityTitle(priority)}</span></div><div className="detail-field"><span>Due date</span><span className="detail-value"><Icon name="calendar" size={14} />{formatShortDate(dueDate)}</span></div><div className="detail-field"><span>Project</span><Link className="detail-project-link" href={`/${slug}/projects/${project.id}`}><span className={`project-mini-icon ${project.accent}`}><Icon name={project.icon} size={13} /></span>{project.code}</Link></div><div className="detail-field"><span>Created</span><span className="detail-value">{formatShortDate(task.updatedAt)}</span></div><div className="detail-field"><span>Parent task</span>{parent ? <Link className="detail-project-link" href={`/${slug}/tasks/${parent.id}`}>{parent.key}<Icon name="arrow-up-right" size={13} /></Link> : <span className="detail-muted">None</span>}</div></section>
              <section className="drawer-activity-card"><div className="drawer-tabs"><button className={tab === "comments" ? "is-active" : ""} onClick={() => setTab("comments")}>Comments <span>{comments.length}</span></button><button className={tab === "activity" ? "is-active" : ""} onClick={() => setTab("activity")}>Activity</button></div>
                {tab === "comments" ? <><div className="comment-list">{comments.length ? comments.map((comment) => <CommentItem comment={comment} key={comment.id} />) : <p className="empty-inline">Start a conversation about this task.</p>}</div><form className="comment-composer" onSubmit={addComment}><Avatar member={demoMembers[0]} size="sm" /><textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Leave a comment..." rows={2} /><button type="submit" disabled={!commentText.trim()} aria-label="Send comment"><Icon name="send" size={15} /></button><div className="composer-hint"><span><Icon name="at-sign" size={13} /> Mention</span><span>Enter to send</span></div></form></> : <div className="task-timeline"><TimelineRow member={demoMembers[0]} text="created this task" time="Nov 18" /><TimelineRow member={demoMembers[1]} text="added a review note" time="Nov 20" /><TimelineRow member={demoMembers[0]} text="updated the due date" time="Nov 21" /></div>}
              </section>
            </aside>
          </div>
        </div>
        <footer className="drawer-footer"><span className="autosave-dot" /><span>Changes saved for this session</span><span className="drawer-key-hint">Press <kbd>Esc</kbd> to close</span></footer>
      </section>
    </div>
  );
}

function CommentItem({ comment }: { comment: DemoComment }) {
  const author = getMember(comment.authorId);
  return <article className="comment-item"><Avatar member={author} size="sm" /><div className="comment-body"><div className="comment-author-row"><strong>{author?.name ?? "Workspace member"}</strong><time>{relativeTime(comment.createdAt)}</time></div><p>{comment.content}</p><button onClick={() => toast.message("Reply to comment", { description: "Threaded replies are not connected in this demo." })}>Reply</button></div></article>;
}

function TimelineRow({ member, text, time }: { member: typeof demoMembers[number]; text: string; time: string }) {
  return <div className="timeline-row"><Avatar member={member} size="sm" /><div><p><strong>{member.name}</strong> {text}</p><time>{time}</time></div></div>;
}

function priorityTitle(priority: TaskPriority) { return priority.charAt(0) + priority.slice(1).toLowerCase(); }
function relativeTime(date: string) { const minutes = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60_000)); if (minutes < 60) return `${minutes}m ago`; if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`; return `${Math.round(minutes / 1440)}d ago`; }
