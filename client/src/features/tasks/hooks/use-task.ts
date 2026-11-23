"use client";

import { useQuery } from "@tanstack/react-query";
import { taskApi } from "../api/task.api";
import { taskQueryKeys } from "./use-tasks";

export function useTask(workspaceId: string | undefined, projectId: string, taskId: string) {
  return useQuery({
    queryKey: taskQueryKeys.detail(workspaceId ?? "none", projectId, taskId),
    queryFn: () => taskApi.get(workspaceId!, projectId, taskId),
    enabled: Boolean(workspaceId && projectId && taskId),
    retry: false,
    staleTime: 30_000,
  });
}
