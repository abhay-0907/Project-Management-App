"use client";

import { useQuery } from "@tanstack/react-query";
import { taskApi } from "@/features/tasks/api/task.api";

export const projectBoardQueryKey = (workspaceId: string, projectId: string) =>
  ["workspaces", workspaceId, "projects", projectId, "board"] as const;

export function useProjectBoard(workspaceId: string | undefined, projectId: string) {
  return useQuery({
    queryKey: projectBoardQueryKey(workspaceId ?? "none", projectId),
    queryFn: () => taskApi.board(workspaceId!, projectId),
    enabled: Boolean(workspaceId && projectId),
    retry: false,
    staleTime: 30_000,
  });
}
