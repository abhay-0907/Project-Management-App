"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "../api/workspace.api";
import { workspaceQueryKeys } from "./use-workspaces";
import { activityQueryKeys } from "@/features/activity-logs/hooks/use-activity-feed";

export function useRemoveWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => workspaceApi.removeMember(workspaceId, memberId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.byId(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.list }),
        queryClient.invalidateQueries({ queryKey: activityQueryKeys.workspace(workspaceId) }),
      ]);
    },
  });
}
