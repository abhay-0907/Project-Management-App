"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { workspaceQueryKeys } from "../hooks/use-workspaces";
import type { Workspace } from "../types/workspace.types";

export function WorkspaceSwitcher({
  activeWorkspace,
  workspaces,
  onNavigate,
}: {
  activeWorkspace: Workspace;
  workspaces: Workspace[];
  onNavigate?: () => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  function openWorkspace(workspace: Workspace) {
    void queryClient.invalidateQueries({
      queryKey: workspaceQueryKeys.byId(workspace.id),
    });
    onNavigate?.();
    router.push(`/${workspace.slug}`);
  }

  return (
    <DropdownMenuTrigger>
      <Button
        aria-label={`Switch workspace. Current workspace: ${activeWorkspace.name}`}
        className="workspace-picker"
        variant="outline"
        size="lg"
      >
        <span className="workspace-picker-copy">
          <strong>{activeWorkspace.name}</strong>
          <small>{activeWorkspace.role}</small>
        </span>
        <Icon aria-hidden="true" name="chevron-down" size={16} />
      </Button>

      <DropdownMenu className="workspace-switcher-menu" placement="bottom start">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="workspace-switcher-label">YOUR WORKSPACES</DropdownMenuLabel>
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              aria-current={workspace.id === activeWorkspace.id ? "page" : undefined}
              className={`workspace-switcher-option ${workspace.id === activeWorkspace.id ? "is-current" : ""}`}
              key={workspace.id}
              onAction={() => openWorkspace(workspace)}
              textValue={workspace.name}
            >
              <span className="workspace-switcher-monogram">
                {workspace.name.trim().charAt(0).toUpperCase() || "W"}
              </span>
              <span className="workspace-switcher-option-copy">
                <strong>{workspace.name}</strong>
                <small>{workspace.role.toLowerCase()}</small>
              </span>
              {workspace.id === activeWorkspace.id && <Icon aria-hidden="true" name="check" size={15} />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="workspace-switcher-manage"
          onAction={() => { onNavigate?.(); router.push("/workspaces"); }}
        >
          <Icon aria-hidden="true" name="layers" size={15} /> All workspaces
        </DropdownMenuItem>
        <DropdownMenuItem
          className="workspace-switcher-create"
          onAction={() => { onNavigate?.(); router.push("/onboarding/create-workspace"); }}
        >
          <Icon aria-hidden="true" name="plus" size={15} /> Create workspace
        </DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  );
}
