"use client";

import { useQuery } from "@tanstack/react-query";
import { workspaceApi } from "../api/workspace.api";

export const workspaceQueryKeys = {
  all: ["workspaces"] as const,
  list: ["workspaces", "list"] as const,
  byId: (workspaceId: string) => ["workspaces", workspaceId] as const,
  detail: (workspaceId: string) => ["workspaces", workspaceId, "detail"] as const,
  projects: (workspaceId: string) => ["workspaces", workspaceId, "projects"] as const,
  tasks: (workspaceId: string) => ["workspaces", workspaceId, "tasks"] as const,
};

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceQueryKeys.list,
    queryFn: workspaceApi.list,
    retry: false,
  });
}
