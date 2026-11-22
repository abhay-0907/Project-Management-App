"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "../api/auth.api";
import { authQueryKeys, getAuthErrorMessage } from "../utils/auth.utils";

export function useForgotPassword() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (result) =>
      toast.success("Reset code requested", { description: result.message }),
    onError: (error) =>
      toast.error("Could not request a reset code", { description: getAuthErrorMessage(error) }),
  });
}

export function useVerifyPasswordResetOtp() {
  return useMutation({
    mutationFn: authApi.verifyPasswordResetOtp,
    onSuccess: (result) => toast.success("Code verified", { description: result.message }),
    onError: (error) =>
      toast.error("Code verification failed", { description: getAuthErrorMessage(error) }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: (result) => toast.success("Password updated", { description: result.message }),
    onError: (error) =>
      toast.error("Could not reset your password", { description: getAuthErrorMessage(error) }),
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.sessions });
      toast.success("Password changed", { description: result.message });
    },
    onError: (error) =>
      toast.error("Could not change your password", { description: getAuthErrorMessage(error) }),
  });
}
