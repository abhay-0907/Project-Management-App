"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "../api/workspace.api";
import { workspaceQueryKeys } from "./use-workspaces";

export function useRemoveWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => workspaceApi.removeMember(workspaceId, memberId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.byId(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.list }),
      ]);
    },
  });
}
