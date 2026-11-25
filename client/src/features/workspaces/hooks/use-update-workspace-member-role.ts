"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "../api/workspace.api";
import type { AssignableWorkspaceRole } from "../types/workspace.types";
import { workspaceQueryKeys } from "./use-workspaces";
import { activityQueryKeys } from "@/features/activity-logs/hooks/use-activity-feed";

export function useUpdateWorkspaceMemberRole(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: AssignableWorkspaceRole }) =>
      workspaceApi.updateMemberRole(workspaceId, memberId, role),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: activityQueryKeys.workspace(workspaceId) }),
      ]);
    },
  });
}
