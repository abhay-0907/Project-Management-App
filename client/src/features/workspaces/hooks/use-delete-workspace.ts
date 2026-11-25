"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "../api/workspace.api";
import { workspaceQueryKeys } from "./use-workspaces";
import { activityQueryKeys } from "@/features/activity-logs/hooks/use-activity-feed";

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workspaceApi.delete,
    onSuccess: async (_result, workspaceId) => {
      queryClient.removeQueries({ queryKey: workspaceQueryKeys.byId(workspaceId) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.list }),
        queryClient.invalidateQueries({ queryKey: activityQueryKeys.workspace(workspaceId) }),
      ]);
    },
  });
}
