"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "../api/auth.api";
import { getAuthErrorMessage } from "../utils/auth.utils";

export function useVerifyEmail() {
  return useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: () => toast.success("Email verified", { description: "You can now sign in." }),
    onError: (error) =>
      toast.error("Could not verify your email", { description: getAuthErrorMessage(error) }),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: (result) =>
      toast.success("Verification code requested", { description: result.message }),
    onError: (error) =>
      toast.error("Could not resend the code", { description: getAuthErrorMessage(error) }),
  });
}
