"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/shared/icon";
import { Select } from "@/components/ui/select";
import { formatShortDate } from "@/features/dashboard/api/demo-data";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { ProjectApiError, type ProjectRecord, type ProjectStatus } from "../api/project.api";
import { useCreateProject, useProjects } from "../hooks/use-projects";

type Props = { initialStatus?: string };
type ViewMode = "grid" | "list";
type SortMode = "updated" | "newest" | "name";
type ProjectLifecycle = ProjectStatus;
const projectLifecycleStatuses: readonly ProjectLifecycle[] = ["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"];

const pageSize = 12;

export function ProjectsOverview({ initialStatus = "ALL" }: Props) {
  const params = useParams<{ workspaceSlug: string }>();
  const router = useRouter();
  const slug = params.workspaceSlug;
  const workspaceQuery = useWorkspaces();
  const workspace = workspaceQuery.data?.find((item) => item.slug === slug);
  const initialProjectStatus = isProjectLifecycle(initialStatus) ? initialStatus : "ALL";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectLifecycle | "ALL">(initialProjectStatus);
  const [sortBy, setSortBy] = useState<SortMode>("updated");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>("grid");
  const [createOpen, setCreateOpen] = useState(false);
  useEffect(() => {
    setStatus(isProjectLifecycle(initialStatus) ? initialStatus : "ALL");
    setPage(1);
  }, [initialStatus]);
  const projectQuery = useProjects(workspace?.id, {
    page,
    pageSize,
    search: search.trim() || undefined,
    status: status === "ALL" ? undefined : status,
    sort: sortBy,
  });
  useEffect(() => {
    if (projectQuery.error instanceof ProjectApiError && projectQuery.error.status === 401) {
      router.replace("/login");
    }
  }, [projectQuery.error, router]);
  const projects = projectQuery.data?.projects ?? [];
  const summary = projectQuery.data?.summary;
  const pagination = projectQuery.data?.pagination;

  function exportProjects() {
    const rows = [
      ["Project ID", "Name", "Status", "Creator", "Start date", "Due date"],
      ...projects.map((project) => [
        project.id,
        project.name,
        project.status,
        project.creator?.name ?? "",
        project.startDate ?? "",
        project.dueDate ?? "",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nexora-projects.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Current project page exported", {
      description: `${projects.length} project${projects.length === 1 ? "" : "s"} included.`,
    });
  }

  if (workspaceQuery.isPending || (workspace && projectQuery.isPending)) {
    return <ProjectLoading />;
  }

  if (!workspace) {
    return (
      <ProjectMessage
        title="Workspace unavailable"
        message="We could not find this workspace in your account. Return to the workspace selector and try again."
        action={<Link className="button button-primary" href="/workspaces">Choose a workspace</Link>}
      />
    );
  }

  if (projectQuery.isError) {
    const message = projectQuery.error instanceof ProjectApiError
      ? projectQuery.error.message
      : "Could not load projects. Please try again.";
    return (
      <ProjectMessage
        title="Projects could not be loaded"
        message={message}
        action={<button className="button button-secondary" onClick={() => void projectQuery.refetch()}>Try again</button>}
      />
    );
  }

  const totalPages = pagination?.totalPages ?? 0;

  return (
    <div className="projects-page">
      <section className="projects-heading-row">
        <div>
          <span className="eyebrow">PORTFOLIO</span>
          <h1>
            Projects <span className="heading-count">{summary?.total ?? 0}</span>
            <span className="sync-chip"><i /> From your workspace</span>
          </h1>
          <p className="page-subtitle">Keep initiatives, ownership, and delivery dates in one place.</p>
        </div>
        <div className="heading-actions">
          <button className="button button-secondary" onClick={exportProjects} disabled={!projects.length}>
            <Icon name="download" size={16} /> Export page
          </button>
          <button className="button button-primary" onClick={() => setCreateOpen(true)}>
            <Icon name="plus" size={17} /> New project
          </button>
        </div>
      </section>

      <section className="portfolio-metrics">
        <PortfolioMetric label="All projects" value={summary?.total ?? 0} note="In this workspace" icon="layers" tone="blue" />
        <PortfolioMetric label="In progress" value={summary?.active ?? 0} note="Active" icon="activity" tone="green" />
        <PortfolioMetric label="On hold" value={summary?.onHold ?? 0} note="Needs attention" icon="clock" tone="amber" />
        <PortfolioMetric label="Completed" value={summary?.completed ?? 0} note="Finished initiatives" icon="check-circle" tone="violet" />
      </section>

      <section className="project-filter-panel">
        <label className="project-search">
          <Icon name="search" size={18} />
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search by project name"
          />
          <kbd>/</kbd>
        </label>
        <div className="project-filter-controls">
          <label className="filter-select">
            <span>Status</span>
            <Select
              ariaLabel="Filter projects by status"
              className="filter-select-control"
              value={status}
              onValueChange={(value) => { setStatus(value as ProjectLifecycle | "ALL"); setPage(1); }}
              options={[
                { value: "ALL", label: "All projects" },
                { value: "ACTIVE", label: "In progress" },
                { value: "ON_HOLD", label: "On hold" },
                { value: "COMPLETED", label: "Completed" },
                { value: "ARCHIVED", label: "Archived" },
              ]}
            />
          </label>
          <label className="filter-select sort-filter">
            <span>Sort</span>
            <Select
              ariaLabel="Sort projects"
              className="filter-select-control"
              value={sortBy}
              onValueChange={(value) => { setSortBy(value as SortMode); setPage(1); }}
              options={[
                { value: "updated", label: "Recently updated" },
                { value: "newest", label: "Newest" },
                { value: "name", label: "Project name" },
              ]}
            />
          </label>
        </div>
        <div className="view-toggle" role="group" aria-label="Project layout">
          <button className={view === "grid" ? "selected" : ""} onClick={() => setView("grid")} aria-label="Grid view"><Icon name="grid" size={17} /></button>
          <button className={view === "list" ? "selected" : ""} onClick={() => setView("list")} aria-label="List view"><Icon name="list" size={17} /></button>
        </div>
      </section>

      <div className="results-label">
        <span>{pagination?.total ?? 0} matching {pagination?.total === 1 ? "project" : "projects"}</span>
        <span>·</span>
        <span>Sorted by {sortBy === "updated" ? "recent activity" : sortBy === "newest" ? "creation date" : "name"}</span>
      </div>
      {projectQuery.isFetching && <div className="workspace-inline-loading" role="status">Updating project results…</div>}

      {projects.length ? view === "grid" ? (
        <section className="projects-grid" aria-label="Project cards">
          {projects.map((project) => <ProjectCard key={project.id} project={project} slug={slug} />)}
        </section>
      ) : (
        <section className="projects-table-wrap">
          <table className="projects-table">
            <thead><tr><th>Project</th><th>Status</th><th>Created by</th><th>Start date</th><th>Due date</th><th /></tr></thead>
            <tbody>{projects.map((project) => <ProjectTableRow key={project.id} project={project} slug={slug} />)}</tbody>
          </table>
        </section>
      ) : (
        <div className="empty-card">
          <span className="empty-icon"><Icon name="search" size={20} /></span>
          <h3>{search || status !== "ALL" ? "No projects match these filters" : "No projects yet"}</h3>
          <p>{search || status !== "ALL" ? "Try another search or status filter." : "Create a project to start organizing work in this workspace."}</p>
          {(search || status !== "ALL") && <button className="button button-quiet" onClick={() => { setSearch(""); setStatus("ALL"); setPage(1); }}>Clear filters</button>}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="project-pagination" aria-label="Project pages">
          <button className="button button-secondary" disabled={page <= 1 || projectQuery.isFetching} onClick={() => setPage((current) => current - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button className="button button-secondary" disabled={page >= totalPages || projectQuery.isFetching} onClick={() => setPage((current) => current + 1)}>Next</button>
        </nav>
      )}

      {createOpen && workspace && (
        <CreateProjectModal
          workspaceId={workspace.id}
          onClose={() => setCreateOpen(false)}
          onCreated={(project) => router.push(`/${slug}/projects/${project.id}`)}
        />
      )}
    </div>
  );
}

function PortfolioMetric({ label, value, note, icon, tone }: { label: string; value: number; note: string; icon: "layers" | "activity" | "clock" | "check-circle"; tone: string }) {
  return <article className="portfolio-metric"><div className={`portfolio-metric-icon ${tone}`}><Icon name={icon} size={17} /></div><span>{label}</span><strong>{value.toString().padStart(2, "0")}</strong><small>{note}</small></article>;
}

function ProjectCard({ project, slug }: { project: ProjectRecord; slug: string }) {
  const accent = projectAccent(project.id);
  return (
    <article className="project-card">
      <div className={`project-card-banner ${accent}`}>
        <div className="project-card-banner-icon"><Icon name="folder" size={20} /></div>
        <span className="project-code">{projectCode(project.id)}</span>
        <span className="project-status"><i />Workspace project</span>
      </div>
      <div className="project-card-content">
        <div className="project-title-row">
          <Link href={`/${slug}/projects/${project.id}`}><h2>{project.name}</h2></Link>
          <ProjectStatus status={project.status} />
        </div>
        <p className="project-description">{project.description || "No description added yet."}</p>
        <div className="project-card-meta">
          <span className="table-owner">{project.creator?.name ?? "Workspace member"}</span>
          <span className="project-card-due"><Icon name="calendar" size={14} />{formatShortDate(project.dueDate)}</span>
        </div>
      </div>
      <Link className="project-card-open" href={`/${slug}/projects/${project.id}`}>
        <span>View project</span><Icon name="arrow-up-right" size={15} />
      </Link>
    </article>
  );
}

function ProjectTableRow({ project, slug }: { project: ProjectRecord; slug: string }) {
  return (
    <tr>
      <td>
        <Link href={`/${slug}/projects/${project.id}`} className="table-project-name">
          <span className={`project-mini-icon ${projectAccent(project.id)}`}><Icon name="folder" size={16} /></span>
          <span><strong>{project.name}</strong><small>{projectCode(project.id)}</small></span>
        </Link>
      </td>
      <td><ProjectStatus status={project.status} /></td>
      <td>{project.creator?.name ?? "Workspace member"}</td>
      <td>{formatShortDate(project.startDate)}</td>
      <td>{formatShortDate(project.dueDate)}</td>
      <td><Link className="table-open" href={`/${slug}/projects/${project.id}`} aria-label={`View ${project.name}`}><Icon name="arrow-up-right" size={16} /></Link></td>
    </tr>
  );
}

function ProjectStatus({ status }: { status: ProjectLifecycle }) {
  const label: Record<ProjectLifecycle, string> = { ACTIVE: "In progress", ON_HOLD: "On hold", COMPLETED: "Completed", ARCHIVED: "Archived" };
  return <span className={`project-status project-status-${status.toLowerCase()}`}><i />{label[status]}</span>;
}

function CreateProjectModal({ workspaceId, onClose, onCreated }: { workspaceId: string; onClose: () => void; onCreated: (project: ProjectRecord) => void }) {
  const createProject = useCreateProject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createProject.mutate({
      workspaceId,
      input: {
        name,
        description: description.trim() || null,
        startDate: startDate || null,
        dueDate: dueDate || null,
      },
    }, {
      onSuccess: ({ project }) => {
        toast.success("Project created", { description: project.name });
        onCreated(project);
      },
    });
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
        <div className="modal-heading">
          <div><span className="eyebrow">NEW INITIATIVE</span><h2 id="new-project-title">Create a project</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <form className="modal-form" onSubmit={submit}>
          <label className="field-label">Project name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Give this project a name" maxLength={150} required /></label>
          <label className="field-label">Description<textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What are you working toward?" /></label>
          <div className="form-grid-two">
            <label className="field-label">Start date<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            <label className="field-label">Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
          </div>
          {createProject.error && <div className="workspace-form-alert" role="alert">{createProject.error.message}</div>}
          <div className="modal-footer">
            <span className="muted-note">Saved to this workspace</span>
            <button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={createProject.isPending}>
              <Icon name="plus" size={16} />{createProject.isPending ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ProjectLoading() {
  return <main className="workspace-route-state" role="status"><span className="workspace-spinner" aria-hidden="true" /><p>Loading projects…</p></main>;
}

function ProjectMessage({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <main className="workspace-route-state"><span className="empty-icon"><Icon name="folder" size={20} /></span><h1>{title}</h1><p>{message}</p>{action}</main>;
}

function isProjectLifecycle(value: string): value is ProjectLifecycle {
  return projectLifecycleStatuses.includes(value as ProjectLifecycle);
}

function projectCode(id: string) {
  return `PRJ-${id.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

function projectAccent(id: string) {
  const accents = ["blue", "violet", "green", "orange"];
  const index = id.charCodeAt(0) % accents.length;
  return accents[index];
}
