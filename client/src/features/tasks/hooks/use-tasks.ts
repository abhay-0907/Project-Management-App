"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { taskApi } from "../api/task.api";
import { workspaceTaskOverviewKey } from "./use-workspace-task-overview";

export const taskQueryKeys = {
  all: (workspaceId: string, projectId: string) =>
    ["workspaces", workspaceId, "projects", projectId, "tasks"] as const,
  list: (workspaceId: string, projectId: string) =>
    ["workspaces", workspaceId, "projects", projectId, "tasks"] as const,
  detail: (workspaceId: string, projectId: string, taskId: string) =>
    ["workspaces", workspaceId, "projects", projectId, "tasks", taskId] as const,
  overview: workspaceTaskOverviewKey,
};

export function useTasks(workspaceId: string | undefined, projectId: string) {
  return useInfiniteQuery({
    queryKey: taskQueryKeys.list(workspaceId ?? "none", projectId),
    queryFn: ({ pageParam }) =>
      taskApi.list(workspaceId!, projectId, {
        page: pageParam,
        pageSize: 100,
        sort: "position",
        order: "asc",
      }),
    enabled: Boolean(workspaceId && projectId),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    retry: false,
    staleTime: 30_000,
  });
}
