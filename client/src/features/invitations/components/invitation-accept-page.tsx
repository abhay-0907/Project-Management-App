"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/shared/icon";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { InvitationApiError } from "../api/invitation.api";
import { useAcceptInvitation, useInvitationPreview, useRejectInvitation } from "../hooks/use-invitations";

export function InvitationAcceptPage({ token }: { token: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const previewQuery = useInvitationPreview(token);
  const currentUser = useCurrentUser();
  const accept = useAcceptInvitation();
  const reject = useRejectInvitation();
  const logout = useLogout();
  const [actionError, setActionError] = useState("");
  const invitation = previewQuery.data;
  const nextPath = `/invite/${token}`;
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const registerHref = `/register?next=${encodeURIComponent(nextPath)}`;
  const emailMatches = Boolean(invitation && currentUser.data && invitation.email.toLowerCase() === currentUser.data.email.toLowerCase());

  async function acceptInvite() {
    setActionError("");
    try {
      const result = await accept.mutateAsync(token);
      router.replace(`/${result.workspaceSlug}`);
      router.refresh();
    } catch (error) { setActionError(messageFor(error)); }
  }

  async function rejectInvite() {
    setActionError("");
    try {
      await reject.mutateAsync(token);
      await queryClient.invalidateQueries({ queryKey: ["invitations", "preview", token] });
    } catch (error) { setActionError(messageFor(error)); }
  }

  async function switchAccount() {
    try {
      await logout.mutateAsync();
      router.replace(loginHref);
    } catch { /* useLogout reports sign-out errors to the user */ }
  }

  return <main className="invite-page"><section className="invite-card">
    <Link href="/" className="brand-mark"><span className="brand-symbol">n</span><span>Nexora</span></Link>
    <span className="invite-illustration"><Icon name="users" size={25} /></span>
    <span className="eyebrow">WORKSPACE INVITATION</span>
    {previewQuery.isLoading || currentUser.isLoading ? <div className="invite-loading" role="status">Loading invitation…</div> : null}
    {previewQuery.isError && !previewQuery.isLoading && <><h1>Invitation unavailable</h1><p>{messageFor(previewQuery.error)}</p><Link className="button button-secondary invite-accept-button" href="/workspaces">Go to Nexora</Link></>}
    {invitation && !previewQuery.isLoading && <>
      <h1>{invitation.status === "PENDING" ? `You've been invited to join ${invitation.workspaceName}` : `Invitation ${statusLabel(invitation.status).toLowerCase()}`}</h1>
      <p>{invitation.inviterName} invited <strong>{invitation.email}</strong> to join as a {invitation.role.toLowerCase()}.</p>
      <div className="invite-workspace"><span className="workspace-monogram">{invitation.workspaceName.slice(0, 1).toUpperCase()}</span><span><strong>{invitation.workspaceName}</strong><small>Workspace · Expires {formatDate(invitation.expiresAt)}</small></span></div>
      {invitation.status === "PENDING" && !currentUser.isLoading && currentUser.isError && <p className="workspace-form-alert" role="alert">Could not check your sign-in status. Refresh the page and try again.</p>}
      {invitation.status === "PENDING" && !currentUser.isLoading && currentUser.data === null && <>
        <p>Sign in or create an account using the invited email address to accept this invitation.</p>
        <Link href={loginHref} className="button button-primary invite-accept-button">Sign in to accept <Icon name="arrow-right" size={16} /></Link>
        <Link href={registerHref} className="invite-register-link">Create an account</Link>
      </>}
      {invitation.status === "PENDING" && currentUser.data && !emailMatches && <>
        <p className="invite-account-note">You are signed in as <strong>{currentUser.data.email}</strong>. Switch accounts to continue with the invited address.</p>
        <button type="button" className="button button-primary invite-accept-button" onClick={() => void switchAccount()} disabled={logout.isPending}>{logout.isPending ? "Signing out…" : "Switch account"}</button>
      </>}
      {invitation.status === "PENDING" && emailMatches && <>
        <div className="invite-actions"><button type="button" className="button button-primary" onClick={() => void acceptInvite()} disabled={accept.isPending || reject.isPending}>{accept.isPending ? "Joining…" : "Accept invitation"}<Icon name="arrow-right" size={16} /></button><button type="button" className="button button-quiet" onClick={() => void rejectInvite()} disabled={accept.isPending || reject.isPending}>{reject.isPending ? "Declining…" : "Decline"}</button></div>
      </>}
      {invitation.status !== "PENDING" && <p>This invitation cannot be used. Contact a workspace owner if you still need access.</p>}
      {actionError && <p className="workspace-form-alert" role="alert">{actionError}</p>}
    </>}
    <small className="invite-footnote">The invitation can only be accepted by the account registered to the invited email.</small>
  </section></main>;
}

function messageFor(error: unknown) { return error instanceof InvitationApiError ? error.message : error instanceof Error ? error.message : "The request failed. Please try again."; }
function formatDate(value: string) { return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function statusLabel(status: string) { return status === "REVOKED" ? "cancelled" : status === "REJECTED" ? "declined" : status.toLowerCase(); }
