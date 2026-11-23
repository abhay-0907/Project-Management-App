"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskApi } from "@/features/tasks/api/task.api";
import { taskQueryKeys } from "@/features/tasks/hooks/use-tasks";
import { workspaceTaskOverviewKey } from "@/features/tasks/hooks/use-workspace-task-overview";
import type {
  CreateBoardColumnInput,
  DeleteBoardColumnInput,
  UpdateBoardColumnInput,
} from "../types/project-board.types";
import { projectBoardQueryKey } from "./use-project-board";

type BoardContext = { workspaceId: string; projectId: string };

function useInvalidateBoard() {
  const queryClient = useQueryClient();
  return async ({ workspaceId, projectId }: BoardContext) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: projectBoardQueryKey(workspaceId, projectId) }),
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all(workspaceId, projectId) }),
      queryClient.invalidateQueries({ queryKey: workspaceTaskOverviewKey(workspaceId) }),
    ]);
  };
}

export function useCreateBoardColumn() {
  const invalidateBoard = useInvalidateBoard();
  return useMutation({
    mutationFn: ({ workspaceId, projectId, input }: BoardContext & { input: CreateBoardColumnInput }) =>
      taskApi.createBoardColumn(workspaceId, projectId, input),
    onSuccess: (_result, variables) => invalidateBoard(variables),
  });
}

export function useUpdateBoardColumn() {
  const invalidateBoard = useInvalidateBoard();
  return useMutation({
    mutationFn: ({ workspaceId, projectId, statusId, input }: BoardContext & {
      statusId: string;
      input: UpdateBoardColumnInput;
    }) => taskApi.updateBoardColumn(workspaceId, projectId, statusId, input),
    onSuccess: (_result, variables) => invalidateBoard(variables),
  });
}

export function useDeleteBoardColumn() {
  const invalidateBoard = useInvalidateBoard();
  return useMutation({
    mutationFn: ({ workspaceId, projectId, statusId, input }: BoardContext & {
      statusId: string;
      input: DeleteBoardColumnInput;
    }) => taskApi.deleteBoardColumn(workspaceId, projectId, statusId, input),
    onSuccess: (_result, variables) => invalidateBoard(variables),
  });
}
