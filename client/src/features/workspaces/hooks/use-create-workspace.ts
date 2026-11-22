"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "../api/workspace.api";
import { workspaceQueryKeys } from "./use-workspaces";

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workspaceApi.create,
    onSuccess: async ({ workspace }) => {
      queryClient.setQueryData(workspaceQueryKeys.detail(workspace.id), workspace);
      await queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.list });
    },
  });
}
