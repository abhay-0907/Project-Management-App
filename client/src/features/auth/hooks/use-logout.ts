"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "../api/auth.api";
import { authQueryKeys, getAuthErrorMessage } from "../utils/auth.utils";
import { workspaceQueryKeys } from "@/features/workspaces/hooks/use-workspaces";

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(authQueryKeys.currentUser, null);
      queryClient.removeQueries({ queryKey: authQueryKeys.sessions });
      queryClient.removeQueries({ queryKey: workspaceQueryKeys.all });
      toast.success("Signed out");
    },
    onError: (error) =>
      toast.error("Could not sign out", { description: getAuthErrorMessage(error) }),
  });
}
