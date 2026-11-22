"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/shared/icon";
import { demoWorkspace } from "@/features/dashboard/api/demo-data";

export function WorkspaceSettings() {
  const [name, setName] = useState(demoWorkspace.name);
  const [slug, setSlug] = useState(demoWorkspace.slug);
  const [saved, setSaved] = useState(true);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaved(true); toast.success("Workspace settings saved for this session"); }
  return <div className="settings-page"><section className="settings-heading"><div><span className="eyebrow">WORKSPACE PREFERENCES</span><h1>Settings</h1><p className="page-subtitle">Shape how your team organizes and shares work.</p></div></section><div className="settings-layout"><nav className="settings-nav"><button className="selected"><Icon name="grid" size={16} /> General</button><button onClick={() => toast.message("Members & access", { description: "Manage people from the Members page." })}><Icon name="users" size={16} /> Members & access</button><button onClick={() => toast.message("Notifications", { description: "Notification settings will be available here." })}><Icon name="bell" size={16} /> Notifications</button></nav><div className="settings-content"><section className="settings-card"><div className="settings-card-heading"><div><h2>Workspace identity</h2><p>Basic details your teammates see across Nexora.</p></div><span className="settings-workspace-mark">A</span></div><form className="settings-form" onSubmit={submit}><label className="field-label">Workspace name<input value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} maxLength={150} /></label><label className="field-label">Workspace URL<div className="slug-input"><span>nexora.app/</span><input value={slug} onChange={(event) => { setSlug(event.target.value); setSaved(false); }} maxLength={100} /></div><small>Use lowercase letters, numbers, and hyphens.</small></label><div className="settings-form-footer"><span className="muted-note">{saved ? "All changes saved" : "You have unsaved changes"}</span><button type="submit" className="button button-primary" disabled={saved}>Save changes</button></div></form></section><section className="settings-card settings-danger-card"><div><span className="eyebrow">ADVANCED</span><h2>Workspace lifecycle</h2><p>Archiving makes this workspace read-only for its members.</p></div><button className="button button-secondary" onClick={() => toast.message("Archive workspace", { description: "This action is not connected in the demo." })}><Icon name="archive" size={15} /> Archive workspace</button></section></div></div></div>;
}
