"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/layout/dashboard-shell";
import { Icon } from "@/components/shared/icon";
import { demoMembers, demoProjects, demoWorkspace, formatShortDate, getMember, getProjectProgress, getProjectTasks, getStatus, type ProjectLifecycle } from "@/features/dashboard/api/demo-data";

type Props = { initialStatus?: string };
type ViewMode = "grid" | "list";

export function ProjectsOverview({ initialStatus = "ALL" }: Props) {
  const params = useParams<{ workspaceSlug: string }>();
  const slug = params.workspaceSlug || demoWorkspace.slug;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [lead, setLead] = useState("ALL");
  const [sortBy, setSortBy] = useState("updated");
  const [view, setView] = useState<ViewMode>("grid");
  const [createOpen, setCreateOpen] = useState(false);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return demoProjects
      .filter((project) => status === "ALL" || project.status === status)
      .filter((project) => lead === "ALL" || project.createdBy === lead)
      .filter((project) => !query || `${project.name} ${project.code} ${project.description}`.toLowerCase().includes(query))
      .sort((a, b) => sortBy === "name" ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt));
  }, [lead, search, sortBy, status]);

  function exportProjects() {
    const rows = [["Code", "Name", "Status", "Start date", "Due date", "Progress"], ...filteredProjects.map((project) => [project.code, project.name, project.status, project.startDate, project.dueDate, `${getProjectProgress(project.id)}%`])];
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "nexora-projects.csv"; anchor.click(); URL.revokeObjectURL(url);
    toast.success("Project list exported", { description: `${filteredProjects.length} project${filteredProjects.length === 1 ? "" : "s"} included.` });
  }

  return (
    <div className="projects-page">
      <section className="projects-heading-row">
        <div><span className="eyebrow">PORTFOLIO</span><h1>Projects <span className="heading-count">{demoProjects.length}</span><span className="sync-chip"><i /> Updated just now</span></h1><p className="page-subtitle">Keep initiatives, ownership, and delivery dates in one place.</p></div>
        <div className="heading-actions"><button className="button button-secondary" onClick={exportProjects}><Icon name="download" size={16} /> Export CSV</button><button className="button button-primary" onClick={() => setCreateOpen(true)}><Icon name="plus" size={17} /> New project</button></div>
      </section>

      <section className="portfolio-metrics">
        <PortfolioMetric label="All projects" value={demoProjects.length} note="In this workspace" icon="layers" tone="blue" />
        <PortfolioMetric label="In progress" value={demoProjects.filter((project) => project.status === "ACTIVE").length} note="Moving forward" icon="activity" tone="green" />
        <PortfolioMetric label="On hold" value={demoProjects.filter((project) => project.status === "ON_HOLD").length} note="Needs attention" icon="clock" tone="amber" />
        <PortfolioMetric label="Completed" value={demoProjects.filter((project) => project.status === "COMPLETED").length} note="Shipped initiatives" icon="check-circle" tone="violet" />
      </section>

      <section className="project-filter-panel">
        <label className="project-search"><Icon name="search" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by project name or code" /><kbd>/</kbd></label>
        <div className="project-filter-controls">
          <label className="filter-select"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All projects</option><option value="ACTIVE">In progress</option><option value="ON_HOLD">On hold</option><option value="COMPLETED">Completed</option><option value="ARCHIVED">Archived</option></select><Icon name="chevron-down" size={14} /></label>
          <label className="filter-select"><span>Lead</span><select value={lead} onChange={(event) => setLead(event.target.value)}><option value="ALL">Everyone</option>{demoMembers.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select><Icon name="chevron-down" size={14} /></label>
          <label className="filter-select sort-filter"><span>Sort</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="updated">Recently updated</option><option value="name">Project name</option></select><Icon name="chevron-down" size={14} /></label>
        </div>
        <div className="view-toggle" role="group" aria-label="Project layout"><button className={view === "grid" ? "selected" : ""} onClick={() => setView("grid")} aria-label="Grid view"><Icon name="grid" size={17} /></button><button className={view === "list" ? "selected" : ""} onClick={() => setView("list")} aria-label="List view"><Icon name="list" size={17} /></button></div>
      </section>

      <div className="results-label"><span>{filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"}</span><span>·</span><span>Sorted by {sortBy === "updated" ? "recent activity" : "name"}</span></div>
      {view === "grid" ? <section className="projects-grid" aria-label="Project cards">
        {filteredProjects.map((project) => <ProjectCard key={project.id} project={project} slug={slug} />)}
      </section> : <section className="projects-table-wrap"><table className="projects-table"><thead><tr><th>Project</th><th>Status</th><th>Owner</th><th>Progress</th><th>Due date</th><th /></tr></thead><tbody>{filteredProjects.map((project) => <ProjectTableRow key={project.id} project={project} slug={slug} />)}</tbody></table></section>}
      {!filteredProjects.length && <div className="empty-card"><span className="empty-icon"><Icon name="search" size={20} /></span><h3>No projects found</h3><p>Try a different search term or adjust the filters.</p><button className="button button-quiet" onClick={() => { setSearch(""); setStatus("ALL"); setLead("ALL"); }}>Clear filters</button></div>}
      {createOpen && <CreateProjectModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

function PortfolioMetric({ label, value, note, icon, tone }: { label: string; value: number; note: string; icon: "layers" | "activity" | "clock" | "check-circle"; tone: string }) {
  return <article className="portfolio-metric"><div className={`portfolio-metric-icon ${tone}`}><Icon name={icon} size={17} /></div><span>{label}</span><strong>{value.toString().padStart(2, "0")}</strong><small>{note}</small></article>;
}

function ProjectCard({ project, slug }: { project: typeof demoProjects[number]; slug: string }) {
  const tasks = getProjectTasks(project.id).filter((task) => !task.parentTaskId);
  const progress = getProjectProgress(project.id);
  const contributors = [...new Set(tasks.map((task) => task.assigneeId).filter(Boolean))] as string[];
  return <article className="project-card"><div className={`project-card-banner ${project.accent}`}><div className="project-card-banner-icon"><Icon name={project.icon} size={20} /></div><span className="project-code">{project.code}</span><button className="tiny-icon-button" aria-label={`More options for ${project.name}`} onClick={() => toast.message(project.name, { description: "Project actions" })}><Icon name="more" size={17} /></button></div>
    <div className="project-card-content"><div className="project-title-row"><Link href={`/${slug}/projects/${project.id}`}><h2>{project.name}</h2></Link><ProjectStatus status={project.status} /></div><p className="project-description">{project.description}</p>
      <div className="project-card-progress"><div><span>Completion</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><small>{tasks.filter((task) => getStatus(task.statusId)?.isCompleted).length} of {tasks.length} tasks complete</small></div>
      <div className="project-card-meta"><div className="avatar-stack">{contributors.slice(0, 3).map((id) => <Avatar member={getMember(id)} key={id} size="sm" />)}{contributors.length > 3 && <span className="avatar-overflow">+{contributors.length - 3}</span>}</div><span className="project-card-due"><Icon name="calendar" size={14} />{formatShortDate(project.dueDate)}</span></div>
    </div><Link className="project-card-open" href={`/${slug}/projects/${project.id}/board`}><span>Open project</span><Icon name="arrow-up-right" size={15} /></Link>
  </article>;
}

function ProjectTableRow({ project, slug }: { project: typeof demoProjects[number]; slug: string }) {
  const progress = getProjectProgress(project.id);
  return <tr><td><Link href={`/${slug}/projects/${project.id}/board`} className="table-project-name"><span className={`project-mini-icon ${project.accent}`}><Icon name={project.icon} size={16} /></span><span><strong>{project.name}</strong><small>{project.code}</small></span></Link></td><td><ProjectStatus status={project.status} /></td><td><span className="table-owner"><Avatar member={getMember(project.createdBy)} size="sm" />{getMember(project.createdBy)?.name}</span></td><td><div className="table-progress"><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><span>{progress}%</span></div></td><td>{formatShortDate(project.dueDate)}</td><td><Link className="table-open" href={`/${slug}/projects/${project.id}/board`} aria-label={`Open ${project.name}`}><Icon name="arrow-up-right" size={16} /></Link></td></tr>;
}

function ProjectStatus({ status }: { status: ProjectLifecycle }) {
  const label: Record<ProjectLifecycle, string> = { ACTIVE: "In progress", ON_HOLD: "On hold", COMPLETED: "Completed", ARCHIVED: "Archived" };
  return <span className={`project-status project-status-${status.toLowerCase()}`}><i />{label[status]}</span>;
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lead, setLead] = useState(demoMembers[0].id);
  const [dueDate, setDueDate] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); toast.success("Project draft created", { description: `${name} · ${getMember(lead)?.name ?? "No lead"}` }); onClose(); }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="new-project-title"><div className="modal-heading"><div><span className="eyebrow">NEW INITIATIVE</span><h2 id="new-project-title">Create a project</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div><form className="modal-form" onSubmit={submit}><label className="field-label">Project name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Give this project a name" required /></label><label className="field-label">Description<textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What are you working toward?" /></label><div className="form-grid-two"><label className="field-label">Project lead<select value={lead} onChange={(event) => setLead(event.target.value)}>{demoMembers.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label><label className="field-label">Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label></div><div className="modal-footer"><span className="muted-note">Saved to this demo session</span><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary"><Icon name="plus" size={16} /> Create project</button></div></form></section></div>;
}
