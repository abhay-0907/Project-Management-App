"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Icon } from "@/components/shared/icon";
import { InvitationApiError } from "../api/invitation.api";
import { useCancelInvitation, useCreateInvitation, useResendInvitation, useWorkspaceInvitations } from "../hooks/use-invitations";
import type { InvitationRole, WorkspaceInvitation } from "../types/invitation.types";
import { InviteMemberDialog } from "./invite-member-dialog";
import type { CreateInvitationInput } from "../schemas/invitation.schema";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { WorkspaceApiError } from "@/features/workspaces/api/workspace.api";

type Confirmation = { kind: "cancel"; invitation: WorkspaceInvitation } | null;
const EMPTY_INVITATIONS: WorkspaceInvitation[] = [];

export function InvitationsPage() {
  const params = useParams<{ workspaceSlug: string }>();
  const workspacesQuery = useWorkspaces();
  const workspace = workspacesQuery.data?.find((item) => item.slug === params.workspaceSlug);
  const workspaceId = workspace?.id;
  const canManage = workspace?.role === "OWNER" || workspace?.role === "ADMIN";
  const invitationsQuery = useWorkspaceInvitations(canManage ? workspaceId : undefined);
  const createInvitation = useCreateInvitation(workspaceId ?? "");
  const cancelInvitation = useCancelInvitation(workspaceId ?? "");
  const resendInvitation = useResendInvitation(workspaceId ?? "");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [showCreate, setShowCreate] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [actionError, setActionError] = useState("");
  const invitations = invitationsQuery.data ?? EMPTY_INVITATIONS;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return invitations.filter((item) =>
      (statusFilter === "ALL" || item.status === statusFilter) &&
      (!query || `${item.email} ${item.invitedByName}`.toLowerCase().includes(query)),
    );
  }, [invitations, search, statusFilter]);

  async function submitInvitation({ email, role }: CreateInvitationInput) {
    if (!workspaceId) return;
    try {
      await createInvitation.mutateAsync({ email, role });
      toast.success("Invitation sent", { description: `An invitation was sent to ${email}.` });
      setShowCreate(false);
    } catch (error) {
      return errorMessage(error);
    }
  }

  async function confirmCancel() {
    if (!confirmation || !workspaceId) return;
    setActionError("");
    try {
      await cancelInvitation.mutateAsync(confirmation.invitation.id);
      toast.success("Invitation cancelled", { description: `${confirmation.invitation.email} can no longer use this invitation.` });
      setConfirmation(null);
    } catch (error) {
      setActionError(errorMessage(error));
    }
  }

  async function resend(invitation: WorkspaceInvitation) {
    setActionError("");
    try {
      await resendInvitation.mutateAsync(invitation.id);
      toast.success("Invitation resent", { description: `A fresh link was sent to ${invitation.email}.` });
    } catch (error) {
      setActionError(errorMessage(error));
    }
  }

  if (workspacesQuery.isLoading) return <PageState title="Loading workspace invitations" loading />;
  if (workspacesQuery.isError) return <PageState title="Could not load workspace" error={workspaceErrorMessage(workspacesQuery.error)} onRetry={() => void workspacesQuery.refetch()} />;
  if (!workspace) return <PageState title="Workspace not found" error="You may no longer have access to this workspace." />;
  if (!canManage) return <PageState title="Invitation management restricted" error="Only workspace owners and admins can view or manage invitations." />;
  if (invitationsQuery.isLoading) return <PageState title="Loading workspace invitations" loading />;
  if (invitationsQuery.isError) return <PageState title="Could not load invitations" error={errorMessage(invitationsQuery.error)} onRetry={() => void invitationsQuery.refetch()} />;

  const pendingCount = invitations.filter((item) => item.status === "PENDING").length;
  return (
    <div className="members-page">
      <section className="members-heading">
        <div><span className="eyebrow">PEOPLE &amp; ACCESS</span><h1>Invitations <span className="heading-count">{pendingCount} pending</span></h1><p className="page-subtitle">Review invitations sent to join {workspace.name}.</p></div>
        {canManage && <button className="button button-primary" type="button" onClick={() => { setActionError(""); setShowCreate(true); }}><Icon name="user-plus" size={16} /> Invite member</button>}
      </section>

      {actionError && !confirmation && <p className="workspace-form-alert invitation-page-alert" role="alert">{actionError}</p>}
      <section className="member-table-card panel">
        <div className="member-table-toolbar">
          <label className="project-search"><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search email or inviter" /></label>
          <label className="filter-select"><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All invitations</option><option value="PENDING">Pending</option><option value="ACCEPTED">Accepted</option><option value="REJECTED">Declined</option><option value="EXPIRED">Expired</option><option value="REVOKED">Cancelled</option></select><Icon name="chevron-down" size={14} /></label>
        </div>
        {filtered.length ? <div className="member-table">
          <div className="invitation-table-head invitation-table-head-expanded"><span>Email address</span><span>Role</span><span>Invited by</span><span>Invited</span><span>Expires</span><span>Status</span><span>Actions</span></div>
          {filtered.map((invitation) => <div className="invitation-row invitation-row-expanded" key={invitation.id}>
            <span className="invitation-email"><span className="invite-avatar"><Icon name="at-sign" size={15} /></span><strong>{invitation.email}</strong></span>
            <span className={`role-pill role-${invitation.role.toLowerCase()}`}>{roleLabel(invitation.role)}</span>
            <span className="invitation-inviter">{invitation.invitedByName}</span>
            <time dateTime={invitation.createdAt}>{formatDate(invitation.createdAt)}</time>
            <time dateTime={invitation.expiresAt}>{formatDate(invitation.expiresAt)}</time>
            <span className={`invitation-state invitation-${invitation.status.toLowerCase()}`}><i />{statusLabel(invitation.status)}</span>
            <span className="invitation-actions">
              {canManage && invitation.status === "PENDING" && (workspace.role === "OWNER" || invitation.role === "MEMBER") && <>
                {(workspace.role === "OWNER" || invitation.role === "MEMBER") && <button className="member-action-button" type="button" disabled={resendInvitation.isPending} onClick={() => void resend(invitation)}><Icon name="send" size={14} />Resend</button>}
                <button className="member-action-button is-danger" type="button" onClick={() => { setActionError(""); setConfirmation({ kind: "cancel", invitation }); }}>Cancel</button>
              </>}
              {(!canManage || invitation.status !== "PENDING" || (workspace.role !== "OWNER" && invitation.role !== "MEMBER")) && <span className="member-action-locked">—</span>}
            </span>
          </div>)}
        </div> : <div className="empty-inline centered-empty">{invitations.length ? statusFilter === "PENDING" && !search.trim() ? "There are no pending invitations." : "No invitations match your search and status filter." : "No invitations have been sent to this workspace."}</div>}
      </section>

      {showCreate && <InviteMemberDialog
        allowAdmin={workspace.role === "OWNER"}
        pending={createInvitation.isPending}
        onClose={() => { if (!createInvitation.isPending) setShowCreate(false); }}
        onSubmit={submitInvitation}
      />}
      {confirmation && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !cancelInvitation.isPending) setConfirmation(null); }}>
        <section className="modal-card member-confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="cancel-invitation-title">
          <div className="modal-heading"><div><span className="eyebrow">WORKSPACE ACCESS</span><h2 id="cancel-invitation-title">Cancel this invitation?</h2></div><button className="icon-button" type="button" onClick={() => setConfirmation(null)} disabled={cancelInvitation.isPending} aria-label="Close"><Icon name="close" /></button></div>
          <div className="modal-form"><p>{confirmation.invitation.email} will no longer be able to use this invitation link. You can send a new invitation later.</p>{actionError && <p className="workspace-form-alert" role="alert">{actionError}</p>}<div className="modal-footer"><button className="button button-quiet" type="button" onClick={() => setConfirmation(null)} disabled={cancelInvitation.isPending}>Keep invitation</button><button className="button button-danger" type="button" onClick={() => void confirmCancel()} disabled={cancelInvitation.isPending}>{cancelInvitation.isPending ? "Cancelling…" : "Cancel invitation"}</button></div></div>
        </section>
      </div>}
    </div>
  );
}

function PageState({ title, loading, error, onRetry }: { title: string; loading?: boolean; error?: string; onRetry?: () => void }) {
  return <div className="members-page"><section className="members-heading"><div><span className="eyebrow">PEOPLE &amp; ACCESS</span><h1>{title}</h1></div></section><section className="member-table-card panel member-page-state" aria-live="polite">{loading ? <><span className="workspace-spinner" /><p>Fetching the latest invitations…</p></> : <><p className="workspace-form-alert" role="alert">{error}</p>{onRetry && <button className="button button-secondary" type="button" onClick={onRetry}>Try again</button>}</>}</section></div>;
}

function errorMessage(error: unknown) { return error instanceof InvitationApiError ? error.message : error instanceof Error ? error.message : "The request failed. Check your connection and try again."; }
function workspaceErrorMessage(error: unknown) { return error instanceof WorkspaceApiError ? error.message : errorMessage(error); }
function roleLabel(role: InvitationRole) { return role === "ADMIN" ? "Admin" : "Member"; }
function statusLabel(status: WorkspaceInvitation["status"]) { return status === "REVOKED" ? "Cancelled" : status === "REJECTED" ? "Declined" : status.charAt(0) + status.slice(1).toLowerCase(); }
function formatDate(value: string) { return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
