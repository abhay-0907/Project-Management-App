"use client";

import Link from "next/link";
import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/shared/icon";
import { workspaceQueryKeys } from "../hooks/use-workspaces";
import type { Workspace } from "../types/workspace.types";

export function WorkspaceSwitcher({
  activeWorkspace,
  workspaces,
}: {
  activeWorkspace: Workspace;
  workspaces: Workspace[];
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const queryClient = useQueryClient();

  function closeMenu() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  return (
    <details className="workspace-switcher" ref={detailsRef}>
      <summary className="workspace-picker" aria-label={`Current workspace: ${activeWorkspace.name}`}>
        <span className="workspace-monogram">
          {activeWorkspace.name.trim().charAt(0).toUpperCase() || "W"}
        </span>
        <span className="workspace-picker-copy">
          <strong>{activeWorkspace.name}</strong>
          <small>{activeWorkspace.role.toLowerCase()} · {activeWorkspace.slug}</small>
        </span>
        <Icon name="chevron-down" size={16} />
      </summary>

      <div className="workspace-switcher-menu" role="menu" aria-label="Switch workspace">
        <p className="workspace-switcher-label">YOUR WORKSPACES</p>
        {workspaces.map((workspace) => (
          <Link
            key={workspace.id}
            href={`/${workspace.slug}`}
            role="menuitem"
            aria-current={workspace.id === activeWorkspace.id ? "page" : undefined}
            className={`workspace-switcher-option ${workspace.id === activeWorkspace.id ? "is-current" : ""}`}
            onClick={() => {
              void queryClient.invalidateQueries({
                queryKey: workspaceQueryKeys.byId(workspace.id),
              });
              closeMenu();
            }}
          >
            <span className="workspace-switcher-monogram">
              {workspace.name.trim().charAt(0).toUpperCase() || "W"}
            </span>
            <span className="workspace-switcher-option-copy">
              <strong>{workspace.name}</strong>
              <small>{workspace.role.toLowerCase()}</small>
            </span>
            {workspace.id === activeWorkspace.id && <Icon name="check" size={15} />}
          </Link>
        ))}
        <Link
          href="/workspaces"
          className="workspace-switcher-manage"
          role="menuitem"
          onClick={closeMenu}
        >
          <Icon name="layers" size={15} /> All workspaces
        </Link>
        <Link
          href="/onboarding/create-workspace"
          className="workspace-switcher-create"
          role="menuitem"
          onClick={closeMenu}
        >
          <Icon name="plus" size={15} /> Create workspace
        </Link>
      </div>
    </details>
  );
}
