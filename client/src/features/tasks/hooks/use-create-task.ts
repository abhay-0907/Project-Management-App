"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskApi } from "../api/task.api";
import type { CreateTaskInput } from "../types/task.types";
import { taskQueryKeys } from "./use-tasks";
import { projectBoardQueryKey } from "@/features/projects/hooks/use-project-board";

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, projectId, input }: {
      workspaceId: string;
      projectId: string;
      input: CreateTaskInput;
    }) => taskApi.create(workspaceId, projectId, input),
    onSuccess: async (_task, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: taskQueryKeys.list(variables.workspaceId, variables.projectId),
          exact: true,
        }),
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.overview(variables.workspaceId) }),
        queryClient.invalidateQueries({ queryKey: projectBoardQueryKey(variables.workspaceId, variables.projectId) }),
      ]);
    },
  });
}
