"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/shared/icon";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { ProjectApiError, type ProjectStatus } from "../api/project.api";
import { useDeleteProject, useProject, useUpdateProject } from "../hooks/use-projects";

type ProjectForm = { name: string; description: string; status: ProjectStatus; startDate: string; dueDate: string };
const emptyForm: ProjectForm = { name: "", description: "", status: "ACTIVE", startDate: "", dueDate: "" };

export function ProjectSettings({ projectId }: { projectId: string }) {
  const params = useParams<{ workspaceSlug: string }>();
  const router = useRouter();
  const slug = params.workspaceSlug;
  const workspacesQuery = useWorkspaces();
  const workspace = workspacesQuery.data?.find((item) => item.slug === slug);
  const projectQuery = useProject(workspace?.id, projectId);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const project = projectQuery.data;
  const [form, setForm] = useState<ProjectForm>(emptyForm);

  useEffect(() => {
    if (projectQuery.error instanceof ProjectApiError && projectQuery.error.status === 401) {
      router.replace("/login");
    }
  }, [projectQuery.error, router]);

  useEffect(() => {
    if (!project) return;
    setForm({
      name: project.name,
      description: project.description ?? "",
      status: project.status,
      startDate: project.startDate ?? "",
      dueDate: project.dueDate ?? "",
    });
  }, [project?.id, project?.updatedAt]);

  if (workspacesQuery.isPending || (workspace && projectQuery.isPending)) {
    return <main className="workspace-route-state" role="status"><span className="workspace-spinner" aria-hidden="true" /><p>Loading project settings…</p></main>;
  }
  if (!workspace) {
    return <ProjectSettingsMessage title="Workspace unavailable" message="We could not find this workspace in your account." action={<Link className="button button-primary" href="/workspaces">Choose a workspace</Link>} />;
  }
  if (projectQuery.isError || !project) {
    const message = projectQuery.error instanceof ProjectApiError ? projectQuery.error.message : "This project could not be found in the selected workspace.";
    return <ProjectSettingsMessage title="Project unavailable" message={message} action={<Link className="button button-secondary" href={`/${slug}/projects`}>Back to projects</Link>} />;
  }

  const isDirty = form.name !== project.name ||
    form.description !== (project.description ?? "") ||
    form.status !== project.status ||
    form.startDate !== (project.startDate ?? "") ||
    form.dueDate !== (project.dueDate ?? "");
  const canDelete = workspace.role === "OWNER" || workspace.role === "ADMIN";
  const projectKey = `PRJ-${project.id.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
  const workspaceId = workspace.id;
  const activeProject = project;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateProject.mutate({
      workspaceId,
      projectId: activeProject.id,
      input: {
        name: form.name,
        description: form.description.trim() || null,
        status: form.status,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
      },
    }, {
      onSuccess: () => toast.success("Project settings saved"),
    });
  }

  function removeProject() {
    if (!window.confirm(`Permanently delete “${activeProject.name}” and its tasks? This cannot be undone.`)) return;
    deleteProject.mutate({ workspaceId, projectId: activeProject.id }, {
      onSuccess: () => {
        toast.success("Project deleted");
        router.push(`/${slug}/projects`);
      },
    });
  }

  return (
    <div className="project-settings-page">
      <div className="project-breadcrumb">
        <Link href={`/${slug}/projects`}><Icon name="folder" size={15} /> Projects</Link>
        <Icon name="chevron-right" size={14} />
        <Link href={`/${slug}/projects/${project.id}`}>{project.name}</Link>
        <Icon name="chevron-right" size={14} /><span>Settings</span>
      </div>
      <section className="settings-heading">
        <div><span className="eyebrow">PROJECT PREFERENCES · {projectKey}</span><h1>Project settings</h1><p className="page-subtitle">Update project details and lifecycle.</p></div>
        <Link className="button button-secondary" href={`/${slug}/projects/${project.id}`}><Icon name="grid" size={16} /> Back to project</Link>
      </section>
      <div className="settings-layout">
        <nav className="settings-nav">
          <Link href={`/${slug}/projects/${project.id}`}><Icon name="grid" size={16} /> Overview</Link>
          <button onClick={() => toast.message("Task board is not connected yet")}><Icon name="board" size={16} /> Board</button>
          <button className="selected"><Icon name="settings" size={16} /> General</button>
        </nav>
        <div className="settings-content">
          <section className="settings-card">
            <div className="settings-card-heading"><div><h2>Project information</h2><p>Details used across the project workspace.</p></div><span className="project-icon-tile blue"><Icon name="folder" size={18} /></span></div>
            <form className="settings-form" onSubmit={submit}>
              <label className="field-label">Project name<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} maxLength={150} required /></label>
              <label className="field-label">Description<textarea rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} maxLength={10000} /></label>
              <div className="form-grid-two">
                <label className="field-label">Status<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProjectStatus }))}><option value="ACTIVE">In progress</option><option value="ON_HOLD">On hold</option><option value="COMPLETED">Completed</option><option value="ARCHIVED">Archived</option></select></label>
                <label className="field-label">Start date<input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} /></label>
              </div>
              <label className="field-label">Target date<input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} /></label>
              {(updateProject.error || deleteProject.error) && <div className="workspace-form-alert" role="alert">{updateProject.error?.message ?? deleteProject.error?.message}</div>}
              <div className="settings-form-footer">
                <span className="muted-note">{isDirty ? "You have unsaved changes" : "All changes saved"}</span>
                <button type="submit" className="button button-primary" disabled={!isDirty || updateProject.isPending}>
                  {updateProject.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </section>
          <section className="settings-card settings-danger-card">
            <div><span className="eyebrow">PERMANENT ACTION</span><h2>Delete this project</h2><p>Project tasks, comments, attachments, and related activity records will be removed.</p></div>
            {canDelete ? (
              <button className="button button-secondary" onClick={removeProject} disabled={deleteProject.isPending}>
                <Icon name="archive" size={15} />{deleteProject.isPending ? "Deleting…" : "Delete project"}
              </button>
            ) : <span className="muted-note">Only workspace owners and admins can delete projects.</span>}
          </section>
        </div>
      </div>
    </div>
  );
}

function ProjectSettingsMessage({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <main className="workspace-route-state"><span className="empty-icon"><Icon name="folder" size={20} /></span><h1>{title}</h1><p>{message}</p>{action}</main>;
}
