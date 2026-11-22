"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AuthApiError, authApi } from "../api/auth.api";
import { authQueryKeys, getAuthErrorMessage } from "../utils/auth.utils";
import { workspaceQueryKeys } from "@/features/workspaces/hooks/use-workspaces";

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user }) => {
      queryClient.removeQueries({ queryKey: workspaceQueryKeys.all });
      queryClient.setQueryData(authQueryKeys.currentUser, user);
      toast.success("Signed in", { description: "Welcome back to Nexora." });
    },
    onError: (error) => {
      toast.error("Sign-in failed", {
        description:
          error instanceof AuthApiError && error.status === 401
            ? "Wrong email or password. Please try again."
            : getAuthErrorMessage(error),
      });
    },
  });
}
