"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { authApi } from "../api/auth.api";
import { authQueryKeys, getAuthErrorMessage } from "../utils/auth.utils";

export function useSessions() {
  const sessions = useQuery({
    queryKey: authQueryKeys.sessions,
    queryFn: authApi.getSessions,
  });

  useEffect(() => {
    if (sessions.isError) {
      toast.error("Could not load your sessions", {
        description: getAuthErrorMessage(sessions.error),
      });
    }
  }, [sessions.isError, sessions.error]);

  return sessions;
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.sessions });
      toast.success("Session revoked", { description: result.message });
    },
    onError: (error) =>
      toast.error("Could not revoke the session", { description: getAuthErrorMessage(error) }),
  });
}

export function useLogoutAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: () => {
      queryClient.setQueryData(authQueryKeys.currentUser, null);
      queryClient.removeQueries({ queryKey: authQueryKeys.sessions });
      toast.success("Signed out everywhere", { description: "All active sessions were ended." });
    },
    onError: (error) =>
      toast.error("Could not sign out everywhere", { description: getAuthErrorMessage(error) }),
  });
}
