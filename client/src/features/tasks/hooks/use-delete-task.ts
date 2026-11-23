"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskApi } from "../api/task.api";
import { taskQueryKeys } from "./use-tasks";
import { projectBoardQueryKey } from "@/features/projects/hooks/use-project-board";

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, projectId, taskId }: {
      workspaceId: string;
      projectId: string;
      taskId: string;
    }) => taskApi.delete(workspaceId, projectId, taskId),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: taskQueryKeys.list(variables.workspaceId, variables.projectId), exact: true });
      await queryClient.invalidateQueries({ queryKey: taskQueryKeys.overview(variables.workspaceId) });
      await queryClient.invalidateQueries({ queryKey: projectBoardQueryKey(variables.workspaceId, variables.projectId) });
      queryClient.removeQueries({
        queryKey: taskQueryKeys.detail(variables.workspaceId, variables.projectId, variables.taskId),
        exact: true,
      });
    },
  });
}
