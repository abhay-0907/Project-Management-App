"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskApi } from "../api/task.api";
import type { UpdateTaskInput } from "../types/task.types";
import { taskQueryKeys } from "./use-tasks";
import { projectBoardQueryKey } from "@/features/projects/hooks/use-project-board";

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, projectId, taskId, input }: {
      workspaceId: string;
      projectId: string;
      taskId: string;
      input: UpdateTaskInput;
    }) => taskApi.update(workspaceId, projectId, taskId, input),
    onSuccess: async (_task, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.list(variables.workspaceId, variables.projectId), exact: true }),
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(variables.workspaceId, variables.projectId, variables.taskId) }),
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.overview(variables.workspaceId) }),
        queryClient.invalidateQueries({ queryKey: projectBoardQueryKey(variables.workspaceId, variables.projectId) }),
      ]);
    },
  });
}
