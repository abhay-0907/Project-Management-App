"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/layout/dashboard-shell";
import { Icon } from "@/components/shared/icon";
import { demoMembers } from "@/features/dashboard/api/demo-data";

const invitations = [
  { id: "inv-1", email: "nora.chen@acme.io", role: "MEMBER", status: "PENDING", invitedBy: "u_elena", expiresAt: "2026-11-28", createdAt: "2026-11-14" },
  { id: "inv-2", email: "leo@northstar.dev", role: "ADMIN", status: "PENDING", invitedBy: "u_marcus", expiresAt: "2026-11-26", createdAt: "2026-11-12" },
  { id: "inv-3", email: "taylor@acme.io", role: "MEMBER", status: "EXPIRED", invitedBy: "u_elena", expiresAt: "2026-11-05", createdAt: "2026-10-29" },
];

export function InvitationsPage() {
  const [filter, setFilter] = useState("ALL");
  const filtered = invitations.filter((invitation) => filter === "ALL" || invitation.status === filter);
  return <div className="members-page"><section className="members-heading"><div><span className="eyebrow">PEOPLE & ACCESS</span><h1>Invitations <span className="heading-count">{invitations.filter((item) => item.status === "PENDING").length} pending</span></h1><p className="page-subtitle">Review invitations sent to join this workspace.</p></div><button className="button button-primary" onClick={() => toast.message("Invite a teammate", { description: "Open Members to prepare an invitation." })}><Icon name="user-plus" size={16} /> Invite member</button></section><section className="member-table-card panel"><div className="member-table-toolbar"><div className="invite-toolbar-copy"><strong>Sent invitations</strong><small>Pending invites expire after 7 days.</small></div><label className="filter-select"><span>Status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">All invitations</option><option value="PENDING">Pending</option><option value="ACCEPTED">Accepted</option><option value="EXPIRED">Expired</option><option value="REVOKED">Revoked</option></select><Icon name="chevron-down" size={14} /></label></div><div className="member-table"><div className="invitation-table-head"><span>Email address</span><span>Role</span><span>Invited by</span><span>Expires</span><span>Status</span><span /></div>{filtered.map((invitation) => { const inviter = demoMembers.find((member) => member.id === invitation.invitedBy)!; return <div className="invitation-row" key={invitation.id}><span className="invitation-email"><span className="invite-avatar"><Icon name="at-sign" size={15} /></span><strong>{invitation.email}</strong></span><span className="role-pill">{invitation.role === "ADMIN" ? "Admin" : "Member"}</span><span className="table-owner"><Avatar member={inviter} size="sm" />{inviter.name}</span><span>{formatDate(invitation.expiresAt)}</span><span className={`invitation-state invitation-${invitation.status.toLowerCase()}`}><i />{invitation.status.charAt(0) + invitation.status.slice(1).toLowerCase()}</span><button className="tiny-icon-button" aria-label={`Actions for ${invitation.email}`} onClick={() => toast.message("Invitation actions", { description: "Resend or revoke the invitation." })}><Icon name="more" size={17} /></button></div>; })}</div>{!filtered.length && <div className="empty-inline centered-empty">No invitations with this status.</div>}</section></div>;
}

function formatDate(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
