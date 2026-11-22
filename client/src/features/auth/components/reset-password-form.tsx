"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { LinkButton } from "@/components/ui/button";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useResetPassword, useVerifyPasswordResetOtp } from "../hooks/use-password";
import { resetPasswordSchema, verifyPasswordResetOtpSchema } from "../schemas/auth.schema";
import { getFirstFieldErrors } from "../utils/auth.utils";
import { AuthField } from "./auth-field";
import { AuthSubmitButton } from "./auth-submit-button";

export function ResetPasswordForm() {
  const verifyOtp = useVerifyPasswordResetOtp();
  const resetPassword = useResetPassword();
  const [resetToken, setResetToken] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [complete, setComplete] = useState(false);

  function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = verifyPasswordResetOtpSchema.safeParse({
      email: String(form.get("email") ?? ""),
      otp: String(form.get("otp") ?? ""),
    });
    if (!parsed.success) {
      setFieldErrors(getFirstFieldErrors(parsed.error.flatten()));
      return;
    }
    setFieldErrors({});
    verifyOtp.mutate(parsed.data, { onSuccess: (result) => setResetToken(result.resetToken) });
  }

  function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = resetPasswordSchema.safeParse({
      resetToken,
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
    });
    if (!parsed.success) {
      setFieldErrors(getFirstFieldErrors(parsed.error.flatten()));
      return;
    }
    setFieldErrors({});
    resetPassword.mutate(parsed.data, { onSuccess: () => setComplete(true) });
  }

  return (
    <>
      <CardHeader className="gap-2 px-0 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
          {resetToken ? "Code accepted" : "Account recovery"}
        </p>
        <CardTitle className="text-2xl tracking-tight text-slate-950">
          {complete ? "Password updated" : "Reset your password"}
        </CardTitle>
        <CardDescription>
          {complete
            ? "Your new password is ready. Sign in to continue."
            : resetToken
            ? "Your email is verified. Choose a new password to finish within 5 minutes of requesting the code."
            : "Enter the 6-digit code we emailed you. It expires in 5 minutes."}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-6 px-0">
        {complete ? (
          <div className="space-y-4 text-center">
            <LinkButton href="/login" className="h-11 w-full text-sm">Go to sign in</LinkButton>
          </div>
        ) : resetToken ? (
          <form className="space-y-4" onSubmit={handleResetPassword} noValidate>
            <AuthField name="password" type="password" label="New password" autoComplete="new-password" placeholder="At least 8 characters" required error={fieldErrors.password} />
            <AuthField name="confirmPassword" type="password" label="Confirm password" autoComplete="new-password" placeholder="Enter it again" required error={fieldErrors.confirmPassword} />
            <AuthSubmitButton pending={resetPassword.isPending}>Update password</AuthSubmitButton>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleVerifyCode} noValidate>
            <AuthField name="email" type="email" label="Email address" autoComplete="email" placeholder="you@company.com" required error={fieldErrors.email} />
            <AuthField name="otp" type="text" label="6-digit code" autoComplete="one-time-code" inputMode="numeric" maxLength={6} placeholder="123456" required error={fieldErrors.otp} />
            <AuthSubmitButton pending={verifyOtp.isPending}>Verify code</AuthSubmitButton>
          </form>
        )}
      </CardContent>
      <CardFooter className="mt-6 justify-center px-0">
        <div className="flex flex-col items-center gap-2 text-sm">
          {!complete ? (
            <Link href="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-700">Request a new code</Link>
          ) : null}
          <Link href="/login" className="text-slate-500 hover:text-slate-700">Back to sign in</Link>
        </div>
      </CardFooter>
    </>
  );
}
