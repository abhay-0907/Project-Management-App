"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "../api/auth.api";
import { authQueryKeys } from "../utils/auth.utils";

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.removeQueries();
      queryClient.setQueryData(authQueryKeys.currentUser, null);
      toast.success("Signed out");
    },
    onError: () =>
      toast.error("Could not sign out", { description: "Your session could not be ended. Please try again." }),
  });
}
