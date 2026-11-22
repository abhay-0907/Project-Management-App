"use client";

import { useQuery } from "@tanstack/react-query";
import { workspaceApi } from "../api/workspace.api";
import { workspaceQueryKeys } from "./use-workspaces";

export function useWorkspaceDetails(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceQueryKeys.detail(workspaceId ?? "none"),
    queryFn: () => workspaceApi.get(workspaceId!),
    enabled: Boolean(workspaceId),
    retry: false,
  });
}
