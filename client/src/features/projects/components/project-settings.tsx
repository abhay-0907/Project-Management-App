"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/shared/icon";
import { demoMembers, demoWorkspace, getMember, getProject } from "@/features/dashboard/api/demo-data";

export function ProjectSettings({ projectId }: { projectId: string }) {
  const params = useParams<{ workspaceSlug: string }>();
  const slug = params.workspaceSlug || demoWorkspace.slug;
  const project = getProject(projectId);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [dueDate, setDueDate] = useState(project.dueDate);
  const [lead, setLead] = useState(project.createdBy);
  const [saved, setSaved] = useState(true);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaved(true); toast.success("Project settings saved for this session"); }
  return <div className="project-settings-page"><div className="project-breadcrumb"><Link href={`/${slug}/projects`}><Icon name="folder" size={15} /> Projects</Link><Icon name="chevron-right" size={14} /><Link href={`/${slug}/projects/${project.id}`}>{project.name}</Link><Icon name="chevron-right" size={14} /><span>Settings</span></div><section className="settings-heading"><div><span className="eyebrow">PROJECT PREFERENCES · {project.code}</span><h1>Project settings</h1><p className="page-subtitle">Update project details and ownership.</p></div><Link className="button button-secondary" href={`/${slug}/projects/${project.id}/board`}><Icon name="board" size={16} /> Back to board</Link></section><div className="settings-layout"><nav className="settings-nav"><Link href={`/${slug}/projects/${project.id}`}><Icon name="grid" size={16} /> Overview</Link><Link href={`/${slug}/projects/${project.id}/board`}><Icon name="board" size={16} /> Board</Link><button className="selected"><Icon name="settings" size={16} /> General</button></nav><div className="settings-content"><section className="settings-card"><div className="settings-card-heading"><div><h2>Project information</h2><p>Details used across the project workspace.</p></div><span className={`project-icon-tile ${project.accent}`}><Icon name={project.icon} size={18} /></span></div><form className="settings-form" onSubmit={submit}><label className="field-label">Project name<input value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} maxLength={150} /></label><label className="field-label">Description<textarea rows={4} value={description} onChange={(event) => { setDescription(event.target.value); setSaved(false); }} /></label><div className="form-grid-two"><label className="field-label">Project lead<select value={lead} onChange={(event) => { setLead(event.target.value); setSaved(false); }}>{demoMembers.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select><small>Current lead: {getMember(lead)?.name}</small></label><label className="field-label">Target date<input type="date" value={dueDate} onChange={(event) => { setDueDate(event.target.value); setSaved(false); }} /></label></div><div className="settings-form-footer"><span className="muted-note">{saved ? "All changes saved" : "You have unsaved changes"}</span><button type="submit" className="button button-primary" disabled={saved}>Save changes</button></div></form></section><section className="settings-card settings-danger-card"><div><span className="eyebrow">PROJECT LIFECYCLE</span><h2>Archive this project</h2><p>Archived projects remain available to workspace admins for reference.</p></div><button className="button button-secondary" onClick={() => toast.message("Archive project", { description: "Project lifecycle updates are not connected in the demo." })}><Icon name="archive" size={15} /> Archive project</button></section></div></div></div>;
}
