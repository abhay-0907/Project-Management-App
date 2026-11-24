"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Icon } from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { WorkspaceApiError } from "@/features/workspaces/api/workspace.api";
import { useRemoveWorkspaceMember } from "@/features/workspaces/hooks/use-remove-workspace-member";
import { useWorkspaceMembers } from "@/features/workspaces/hooks/use-workspace-members";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { useUpdateWorkspaceMemberRole } from "@/features/workspaces/hooks/use-update-workspace-member-role";
import type { AssignableWorkspaceRole, WorkspaceMemberRecord } from "@/features/workspaces/types/workspace.types";
import { InvitationApiError } from "@/features/invitations/api/invitation.api";
import { InviteMemberDialog } from "@/features/invitations/components/invite-member-dialog";
import {
  useCancelInvitation,
  useCreateInvitation,
  useResendInvitation,
  useWorkspaceInvitations,
} from "@/features/invitations/hooks/use-invitations";
import type { CreateInvitationInput } from "@/features/invitations/schemas/invitation.schema";
import type { WorkspaceInvitation } from "@/features/invitations/types/invitation.types";

type MemberAction =
  | { kind: "role"; member: WorkspaceMemberRecord; nextRole: AssignableWorkspaceRole }
  | { kind: "remove"; member: WorkspaceMemberRecord };

const EMPTY_MEMBERS: WorkspaceMemberRecord[] = [];

export function MembersPage() {
  const params = useParams<{ workspaceSlug: string }>();
  const workspacesQuery = useWorkspaces();
  const workspace = workspacesQuery.data?.find((item) => item.slug === params.workspaceSlug);
  const workspaceId = workspace?.id;
  const membersQuery = useWorkspaceMembers(workspaceId);
  const updateRole = useUpdateWorkspaceMemberRole(workspaceId ?? "");
  const removeMember = useRemoveWorkspaceMember(workspaceId ?? "");
  const canManageInvitations = workspace?.role === "OWNER" || workspace?.role === "ADMIN";
  const invitationsQuery = useWorkspaceInvitations(canManageInvitations ? workspaceId : undefined);
  const createInvitation = useCreateInvitation(workspaceId ?? "");
  const resendInvitation = useResendInvitation(workspaceId ?? "");
  const cancelInvitation = useCancelInvitation(workspaceId ?? "");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [confirmation, setConfirmation] = useState<MemberAction | null>(null);
  const [actionError, setActionError] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [cancelInvitationTarget, setCancelInvitationTarget] = useState<WorkspaceInvitation | null>(null);
  const [invitationActionError, setInvitationActionError] = useState("");
  const isPending = updateRole.isPending || removeMember.isPending;
  const members = membersQuery.data ?? EMPTY_MEMBERS;
  const pendingInvitations = (invitationsQuery.data ?? []).filter((invitation) => invitation.status === "PENDING");
  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return members.filter((member) =>
      (roleFilter === "ALL" || member.role === roleFilter) &&
      (!query || `${member.name} ${member.email}`.toLowerCase().includes(query)),
    );
  }, [members, roleFilter, search]);

  async function confirmAction() {
    if (!confirmation || !workspaceId) return;
    setActionError("");
    try {
      if (confirmation.kind === "role") {
        await updateRole.mutateAsync({ memberId: confirmation.member.id, role: confirmation.nextRole });
        toast.success("Member role updated", { description: `${confirmation.member.name} is now ${confirmation.nextRole.toLowerCase()}.` });
      } else {
        await removeMember.mutateAsync(confirmation.member.id);
        toast.success("Member removed", { description: `${confirmation.member.name} no longer has access to this workspace.` });
      }
      setConfirmation(null);
    } catch (error) {
      setActionError(error instanceof WorkspaceApiError ? error.message : "The member change could not be completed. Try again.");
    }
  }

  async function submitInvitation(input: CreateInvitationInput) {
    if (!workspaceId) return "Workspace is not available. Refresh and try again.";
    try {
      await createInvitation.mutateAsync(input);
      toast.success("Invitation sent", { description: `An invitation was sent to ${input.email}.` });
      setShowInviteDialog(false);
    } catch (error) {
      return error instanceof InvitationApiError ? error.message : "The invitation could not be sent. Try again.";
    }
  }

  async function resendInvite(invitation: WorkspaceInvitation) {
    setInvitationActionError("");
    try {
      await resendInvitation.mutateAsync(invitation.id);
      toast.success("Invitation resent", { description: `A fresh link was sent to ${invitation.email}.` });
    } catch (error) {
      setInvitationActionError(invitationErrorMessage(error));
    }
  }

  async function confirmCancelInvite() {
    if (!cancelInvitationTarget) return;
    setInvitationActionError("");
    try {
      await cancelInvitation.mutateAsync(cancelInvitationTarget.id);
      toast.success("Invitation cancelled", { description: `${cancelInvitationTarget.email} can no longer use this invitation.` });
      setCancelInvitationTarget(null);
    } catch (error) {
      setInvitationActionError(invitationErrorMessage(error));
    }
  }

  if (workspacesQuery.isLoading) {
    return <MembersPageState title="Loading workspace members" loading />;
  }
  if (workspacesQuery.isError) {
    return <MembersPageState title="Could not load workspace" error={messageFor(workspacesQuery.error)} onRetry={() => void workspacesQuery.refetch()} />;
  }
  if (!workspace) {
    return <MembersPageState title="Workspace not found" error="You may no longer have access to this workspace." />;
  }
  if (membersQuery.isLoading) {
    return <MembersPageState title="Loading workspace members" loading />;
  }
  if (membersQuery.isError) {
    return <MembersPageState title="Could not load members" error={messageFor(membersQuery.error)} onRetry={() => void membersQuery.refetch()} />;
  }

  const admins = members.filter((member) => member.role === "OWNER" || member.role === "ADMIN").length;
  const activeCount = members.filter((member) => member.isActive).length;

  return (
    <div className="members-page">
      <section className="members-heading">
        <div>
          <span className="eyebrow">PEOPLE &amp; ACCESS</span>
          <h1>Workspace members <span className="heading-count">{members.length}</span></h1>
          <p className="page-subtitle">Review membership and manage access for {workspace.name}.</p>
        </div>
        {canManageInvitations && (
          <div className="members-heading-actions">
            <Link className="button button-secondary" href={`/${workspace.slug}/invitations`}>
              <Icon name="send" size={15} />
              Invitations
              {pendingInvitations.length > 0 && <span className="pending-count-badge">{pendingInvitations.length}</span>}
            </Link>
            <Button
              type="button"
              className="button button-primary"
              onPress={() => setShowInviteDialog(true)}
            >
              <Icon name="plus" size={16} />
              Invite member
            </Button>
          </div>
        )}
      </section>

      <section className="member-summary-grid">
        <SummaryCard icon="users" tone="blue" label="Total members" value={members.length} detail="Workspace access" />
        <SummaryCard icon="shield" tone="violet" label="Owners and admins" value={admins} detail="Can manage workspace" />
        <SummaryCard icon="activity" tone="green" label="Active accounts" value={activeCount} detail="User account status" />
      </section>

      <section className="member-table-card panel">
        <div className="member-table-toolbar">
          <label className="project-search">
            <Icon name="search" size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" />
          </label>
          <label className="filter-select">
            <span>Role</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="ALL">All roles</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
            </select>
            <Icon name="chevron-down" size={14} />
          </label>
        </div>

        {filteredMembers.length > 0 ? (
          <div className="member-table">
            <div className="member-table-head"><span>Member</span><span>Role</span><span>Joined</span><span>Account status</span><span>Actions</span></div>
            {filteredMembers.map((member, index) => {
              const canChangeRole = workspace.role === "OWNER" && member.role !== "OWNER";
              const canRemove = member.role !== "OWNER" && (
                workspace.role === "OWNER" || (workspace.role === "ADMIN" && member.role === "MEMBER")
              );
              const nextRole: AssignableWorkspaceRole = member.role === "ADMIN" ? "MEMBER" : "ADMIN";
              return (
                <div className="member-row" key={member.id}>
                  <div className="member-name-cell">
                    <MemberAvatar name={member.name} index={index} />
                    <span><strong>{member.name}</strong><small>{member.email}</small></span>
                  </div>
                  <span className={`role-pill role-${member.role.toLowerCase()}`}>{roleLabel(member.role)}</span>
                  <span>{formatDate(member.joinedAt)}</span>
                  <span className={`access-state ${member.isActive ? "" : "is-inactive"}`}><i />{member.isActive ? "Active" : "Inactive"}</span>
                  <div className="member-actions">
                    {canChangeRole && <button className="member-action-button" type="button" onClick={() => { setActionError(""); setConfirmation({ kind: "role", member, nextRole }); }}><Icon name="edit" size={14} />{nextRole === "ADMIN" ? "Promote" : "Demote"}</button>}
                    {canRemove && <button className="member-action-button is-danger" type="button" onClick={() => { setActionError(""); setConfirmation({ kind: "remove", member }); }}><Icon name="trash" size={14} />Remove</button>}
                    {!canChangeRole && !canRemove && <span className="member-action-locked">—</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-inline centered-empty">
            {members.length ? "No members match your search and role filter." : "This workspace has no members."}
          </div>
        )}
      </section>

      {canManageInvitations && (
        <section className="member-table-card panel pending-invitations-panel" aria-labelledby="pending-invitations-heading">
          <div className="pending-invitations-heading">
            <div>
              <span className="eyebrow">WORKSPACE ACCESS</span>
              <h2 id="pending-invitations-heading">Pending invitations <span className="heading-count">{pendingInvitations.length}</span></h2>
              <p>Invitations awaiting a response, with their expiration dates and available actions.</p>
            </div>
            <Link className="button button-secondary" href={`/${workspace.slug}/invitations`}>View all invitations</Link>
          </div>

          {invitationActionError && !cancelInvitationTarget && <p className="workspace-form-alert invitation-page-alert" role="alert">{invitationActionError}</p>}
          {invitationsQuery.isPending && <div className="invitation-panel-state" role="status"><span className="workspace-spinner" />Loading pending invitations…</div>}
          {invitationsQuery.isError && <div className="invitation-panel-state"><p className="workspace-form-alert" role="alert">{invitationErrorMessage(invitationsQuery.error)}</p><button className="button button-secondary" type="button" onClick={() => void invitationsQuery.refetch()}>Try again</button></div>}
          {invitationsQuery.isSuccess && pendingInvitations.length === 0 && <div className="empty-inline centered-empty">There are no pending invitations for this workspace.</div>}
          {invitationsQuery.isSuccess && pendingInvitations.length > 0 && (
            <div className="invitation-pending-list">
              {pendingInvitations.map((invitation) => {
                const canActOnInvitation = workspace.role === "OWNER" || invitation.role === "MEMBER";
                return (
                  <div className="invitation-pending-row" key={invitation.id}>
                    <span className="invite-avatar"><Icon name="at-sign" size={15} /></span>
                    <div className="invitation-pending-copy">
                      <strong>{invitation.email}</strong>
                      <span>Invited by {invitation.invitedByName} · {roleLabel(invitation.role)}</span>
                    </div>
                    <time dateTime={invitation.expiresAt}>Expires {formatDate(invitation.expiresAt)}</time>
                    <div className="invitation-actions">
                      {canActOnInvitation ? <>
                        <button className="member-action-button" type="button" disabled={resendInvitation.isPending || cancelInvitation.isPending} onClick={() => void resendInvite(invitation)}><Icon name="send" size={14} />Resend</button>
                        <button className="member-action-button is-danger" type="button" disabled={resendInvitation.isPending || cancelInvitation.isPending} onClick={() => { setInvitationActionError(""); setCancelInvitationTarget(invitation); }}>Cancel</button>
                      </> : <span className="member-action-locked">Managed by owner</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {showInviteDialog && (
        <InviteMemberDialog
          allowAdmin={workspace.role === "OWNER"}
          pending={createInvitation.isPending}
          onClose={() => { if (!createInvitation.isPending) setShowInviteDialog(false); }}
          onSubmit={submitInvitation}
        />
      )}

      {cancelInvitationTarget && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !cancelInvitation.isPending) setCancelInvitationTarget(null); }}>
          <section className="modal-card member-confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="cancel-pending-invitation-title">
            <div className="modal-heading">
              <div><span className="eyebrow">WORKSPACE ACCESS</span><h2 id="cancel-pending-invitation-title">Cancel this invitation?</h2></div>
              <button className="icon-button" type="button" onClick={() => setCancelInvitationTarget(null)} disabled={cancelInvitation.isPending} aria-label="Close"><Icon name="close" /></button>
            </div>
            <div className="modal-form">
              <p>{cancelInvitationTarget.email} will no longer be able to use this invitation link. You can invite them again later.</p>
              {invitationActionError && <p className="workspace-form-alert" role="alert">{invitationActionError}</p>}
              <div className="modal-footer">
                <button className="button button-quiet" type="button" onClick={() => setCancelInvitationTarget(null)} disabled={cancelInvitation.isPending}>Keep invitation</button>
                <button className="button button-danger" type="button" onClick={() => void confirmCancelInvite()} disabled={cancelInvitation.isPending}>{cancelInvitation.isPending ? "Cancelling…" : "Cancel invitation"}</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {confirmation && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isPending) setConfirmation(null); }}>
          <section className="modal-card member-confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="member-confirm-title">
            <div className="modal-heading">
              <div><span className="eyebrow">WORKSPACE ACCESS</span><h2 id="member-confirm-title">{confirmation.kind === "role" ? "Confirm role change" : "Remove workspace member?"}</h2></div>
              <button className="icon-button" type="button" onClick={() => setConfirmation(null)} aria-label="Close" disabled={isPending}><Icon name="close" /></button>
            </div>
            <div className="modal-form">
              <p>{confirmation.kind === "role"
                ? roleConfirmationCopy(confirmation.member, confirmation.nextRole)
                : `${confirmation.member.name} will lose access to this workspace and its projects and tasks. Their user account and existing work history will remain.`}</p>
              {actionError && <p className="workspace-form-alert" role="alert">{actionError}</p>}
              <div className="modal-footer">
                <button className="button button-quiet" type="button" onClick={() => setConfirmation(null)} disabled={isPending}>Cancel</button>
                <button className={`button ${confirmation.kind === "remove" ? "button-danger" : "button-primary"}`} type="button" onClick={() => void confirmAction()} disabled={isPending}>
                  {isPending ? "Saving…" : confirmation.kind === "role" ? "Confirm role change" : "Remove member"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function MembersPageState({ title, loading, error, onRetry }: { title: string; loading?: boolean; error?: string; onRetry?: () => void }) {
  return <div className="members-page"><section className="members-heading"><div><span className="eyebrow">PEOPLE &amp; ACCESS</span><h1>{title}</h1></div></section><section className="member-table-card panel member-page-state" aria-live="polite">{loading ? <><span className="workspace-spinner" /><p>Fetching the latest workspace members…</p></> : <><p className="workspace-form-alert" role="alert">{error}</p>{onRetry && <button className="button button-secondary" type="button" onClick={onRetry}>Try again</button>}</>}</section></div>;
}

function SummaryCard({ icon, tone, label, value, detail }: { icon: "users" | "shield" | "activity"; tone: string; label: string; value: number; detail: string }) {
  return <div className="member-summary-card"><span className={`summary-icon ${tone}`}><Icon name={icon} size={17} /></span><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>;
}

function MemberAvatar({ name, index }: { name: string; index: number }) {
  const colors = ["#347eae", "#7b6baa", "#54846c", "#a77445", "#b65d62"];
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <span className="member-avatar" style={{ backgroundColor: colors[index % colors.length] }}>{initials || "?"}</span>;
}

function messageFor(error: unknown) {
  return error instanceof WorkspaceApiError ? error.message : "The request failed. Check your connection and try again.";
}

function invitationErrorMessage(error: unknown) {
  return error instanceof InvitationApiError ? error.message : error instanceof Error ? error.message : "The invitation request failed. Check your connection and try again.";
}

function roleLabel(role: WorkspaceMemberRecord["role"]) {
  return role === "OWNER" ? "Owner" : role === "ADMIN" ? "Admin" : "Member";
}

function roleConfirmationCopy(member: WorkspaceMemberRecord, nextRole: AssignableWorkspaceRole) {
  return nextRole === "ADMIN"
    ? `Promote ${member.name} from Member to Admin? They will gain permission to manage workspace settings and remove regular members.`
    : `Demote ${member.name} from Admin to Member? They will lose administrative permissions for this workspace.`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
