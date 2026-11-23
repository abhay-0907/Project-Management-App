"use client";

import { useQuery } from "@tanstack/react-query";
import { workspaceApi } from "../api/workspace.api";
import { workspaceQueryKeys } from "./use-workspaces";

export function useWorkspaceMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceQueryKeys.members(workspaceId ?? "none"),
    queryFn: () => workspaceApi.members(workspaceId!),
    enabled: Boolean(workspaceId),
    retry: false,
    staleTime: 60_000,
  });
}
