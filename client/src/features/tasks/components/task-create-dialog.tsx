"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Icon } from "@/components/shared/icon";
import { Combobox } from "@/components/ui/combobox";
import { Select } from "@/components/ui/select";
import { TaskApiError } from "../api/task.api";
import { useCreateTask } from "../hooks/use-create-task";
import { useWorkspaceMembers } from "@/features/workspaces/hooks/use-workspace-members";
import { WorkspaceApiError } from "@/features/workspaces/api/workspace.api";
import type { TaskPriority } from "../types/task.types";

type Props = { workspaceId: string; projectId: string; statusId?: string; onClose: () => void };

export function TaskCreateDialog({ workspaceId, projectId, statusId, onClose }: Props) {
  const router = useRouter();
  const membersQuery = useWorkspaceMembers(workspaceId);
  const createTask = useCreateTask();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (
      (createTask.error instanceof TaskApiError && createTask.error.status === 401) ||
      (membersQuery.error instanceof WorkspaceApiError && membersQuery.error.status === 401)
    ) router.replace("/login");
  }, [createTask.error, membersQuery.error, router]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !createTask.isPending) onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [createTask.isPending, onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (startDate && dueDate && dueDate < startDate) {
      setFormError("The due date cannot be earlier than the start date.");
      return;
    }

    try {
      await createTask.mutateAsync({
        workspaceId,
        projectId,
        input: {
          title,
          description: description.trim() || undefined,
          priority,
          statusId,
          assigneeId: assigneeId || null,
          startDate: startDate || null,
          dueDate: dueDate || null,
        },
      });
      toast.success("Task created");
      onClose();
    } catch (error) {
      setFormError(error instanceof TaskApiError ? error.message : "The task could not be created. Try again.");
    }
  }

  const memberError = membersQuery.error instanceof WorkspaceApiError
    ? membersQuery.error.message
    : "Workspace members could not be loaded.";

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !createTask.isPending) onClose();
    }}>
      <section className="modal-card task-create-card" role="dialog" aria-modal="true" aria-labelledby="new-task-title">
        <div className="modal-heading">
          <div><span className="eyebrow">PROJECT TASK</span><h2 id="new-task-title">Create a task</h2></div>
          <button className="icon-button" type="button" onClick={onClose} disabled={createTask.isPending} aria-label="Close"><Icon name="close" /></button>
        </div>
        <form className="modal-form" onSubmit={submit}>
          <label className="field-label">Task title
            <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} maxLength={255} placeholder="What needs to get done?" required />
          </label>
          <label className="field-label">Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={20_000} placeholder="Add a little context for your team" />
          </label>
          <div className="form-grid-two">
            <label className="field-label">Priority
              <Select ariaLabel="Task priority" value={priority} onValueChange={(value) => setPriority(value as TaskPriority)} options={[{ value: "LOW", label: "Low" }, { value: "MEDIUM", label: "Medium" }, { value: "HIGH", label: "High" }, { value: "URGENT", label: "Urgent" }]} />
            </label>
            <label className="field-label">Assignee
              <Combobox
                ariaLabel="Task assignee"
                value={assigneeId}
                onValueChange={setAssigneeId}
                isDisabled={membersQuery.isPending || membersQuery.isError || createTask.isPending}
                options={[
                  { value: "", label: "Unassigned" },
                  ...(membersQuery.data?.filter((member) => member.isActive).map((member) => ({ value: member.id, label: member.name })) ?? []),
                ]}
              />
            </label>
          </div>
          {membersQuery.isPending && <p className="form-hint">Loading workspace members…</p>}
          {membersQuery.isError && <div className="workspace-form-alert" role="alert">{memberError} <button type="button" className="inline-retry" onClick={() => void membersQuery.refetch()}>Retry</button></div>}
          <div className="form-grid-two">
            <label className="field-label">Start date
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <label className="field-label">Due date
              <input type="date" value={dueDate} min={startDate || undefined} onChange={(event) => setDueDate(event.target.value)} />
            </label>
          </div>
          {formError && <p className="workspace-form-alert" role="alert">{formError}</p>}
          <div className="modal-footer">
            <button type="button" className="button button-quiet" onClick={onClose} disabled={createTask.isPending}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={createTask.isPending || !title.trim()}>
              {createTask.isPending ? <><span className="workspace-spinner" /> Creating…</> : <><Icon name="plus" size={16} /> Create task</>}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
