"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Icon } from "@/components/shared/icon";
import { WorkspaceApiError } from "../api/workspace.api";
import { useWorkspaces } from "../hooks/use-workspaces";
import { WorkspaceCard } from "./workspace-card";

export function WorkspaceList() {
  const router = useRouter();
  const workspaces = useWorkspaces();
  const needsSignIn =
    workspaces.error instanceof WorkspaceApiError && workspaces.error.status === 401;

  useEffect(() => {
    if (needsSignIn) router.replace("/login");
  }, [needsSignIn, router]);

  return (
    <main className="workspace-selection-page">
      <header className="workspace-selection-topbar">
        <Link className="brand-mark" href="/workspaces" aria-label="Nexora workspaces">
          <span className="brand-symbol">n</span><span>Nexora</span>
        </Link>
        <span className="workspace-selection-caption">YOUR TEAM SPACES</span>
      </header>

      <section className="workspace-selection-content">
        <div className="workspace-selection-heading">
          <div>
            <span className="eyebrow">WORKSPACE SELECTOR</span>
            <h1>Choose a workspace</h1>
            <p>Open a team space or create one to get started.</p>
          </div>
          <Link href="/onboarding/create-workspace" className="button button-primary">
            <Icon name="plus" size={16} /> Create workspace
          </Link>
        </div>

        {workspaces.isPending ? (
          <div className="workspace-list-state" role="status" aria-live="polite">
            <span className="workspace-spinner" aria-hidden="true" />
            <span>Loading your workspaces…</span>
          </div>
        ) : workspaces.isError ? (
          <div className="workspace-list-state workspace-list-error" role="alert">
            <span className="workspace-state-icon"><Icon name={needsSignIn ? "key" : "activity"} size={19} /></span>
            <h2>{needsSignIn ? "Sign in to see your workspaces" : "We couldn’t load your workspaces"}</h2>
            <p>
              {needsSignIn
                ? "Your workspaces are connected to your account. Sign in to continue."
                : workspaces.error.message}
            </p>
            {needsSignIn ? (
              <Link href="/login" className="button button-primary">Sign in</Link>
            ) : (
              <button className="button button-secondary" onClick={() => void workspaces.refetch()}>
                Try again
              </button>
            )}
          </div>
        ) : workspaces.data.length === 0 ? (
          <div className="workspace-list-state workspace-empty-state">
            <span className="workspace-state-icon"><Icon name="layers" size={20} /></span>
            <h2>No workspaces yet</h2>
            <p>Create a workspace to bring your projects and teammates together.</p>
            <Link href="/onboarding/create-workspace" className="button button-primary">
              <Icon name="plus" size={16} /> Create your first workspace
            </Link>
          </div>
        ) : (
          <div className="workspace-choice-list">
            {workspaces.data.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        )}

        <footer className="workspace-selection-footer">
          <span>Each workspace has its own team and projects.</span>
          <Link href="/onboarding">Back to onboarding</Link>
        </footer>
      </section>
    </main>
  );
}
