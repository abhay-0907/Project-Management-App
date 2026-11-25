"use client";

import { useQuery } from "@tanstack/react-query";
import { activityApi, type ActivityFilter } from "../api/activity.api";

export const activityQueryKeys = {
  workspace: (workspaceId: string) => ["workspaces", workspaceId, "activities"] as const,
  list: (workspaceId: string, filter: ActivityFilter) =>
    ["workspaces", workspaceId, "activities", filter] as const,
};

export function useActivityFeed(workspaceId: string | undefined, filter: ActivityFilter = {}) {
  return useQuery({
    queryKey: activityQueryKeys.list(workspaceId ?? "none", filter),
    queryFn: () => activityApi.list(workspaceId!, filter),
    enabled: Boolean(workspaceId),
    retry: false,
    staleTime: 15_000,
  });
}
