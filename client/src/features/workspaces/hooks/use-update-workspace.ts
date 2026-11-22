"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "../api/workspace.api";
import type { UpdateWorkspaceInput } from "../schemas/workspace.schema";
import { workspaceQueryKeys } from "./use-workspaces";

interface UpdateWorkspaceVariables {
  workspaceId: string;
  input: UpdateWorkspaceInput;
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, input }: UpdateWorkspaceVariables) =>
      workspaceApi.update(workspaceId, input),
    onSuccess: async ({ workspace }) => {
      queryClient.setQueryData(workspaceQueryKeys.detail(workspace.id), workspace);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.detail(workspace.id) }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.list }),
      ]);
    },
  });
}
