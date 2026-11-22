"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "../api/auth.api";
import { getAuthErrorMessage } from "../utils/auth.utils";

export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success("Account created", {
        description: "Check your email and verify your address to continue.",
      });
    },
    onError: (error) => {
      toast.error("Could not create your account", {
        description: getAuthErrorMessage(error),
      });
    },
  });
}
