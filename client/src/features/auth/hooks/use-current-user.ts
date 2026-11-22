"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { AuthApiError, authApi } from "../api/auth.api";
import { authQueryKeys, getAuthErrorMessage } from "../utils/auth.utils";

export function useCurrentUser() {
  const currentUser = useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: async () => {
      try {
        return await authApi.getCurrentUser();
      } catch (error) {
        if (error instanceof AuthApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
  });

  useEffect(() => {
    if (currentUser.isError) {
      toast.error("Could not check your sign-in status", {
        description: getAuthErrorMessage(currentUser.error),
      });
    }
  }, [currentUser.isError, currentUser.error]);

  return currentUser;
}
