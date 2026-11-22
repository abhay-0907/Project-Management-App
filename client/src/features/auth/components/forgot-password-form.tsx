"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { forgotPasswordSchema } from "../schemas/auth.schema";
import { useForgotPassword } from "../hooks/use-password";
import { getFirstFieldErrors } from "../utils/auth.utils";
import { AuthField } from "./auth-field";
import { AuthSubmitButton } from "./auth-submit-button";

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(false);
    const form = new FormData(event.currentTarget);
    const parsed = forgotPasswordSchema.safeParse({ email: String(form.get("email") ?? "") });
    if (!parsed.success) {
      setFieldErrors(getFirstFieldErrors(parsed.error.flatten()));
      return;
    }
    setFieldErrors({});
    forgotPassword.mutate(parsed.data, { onSuccess: () => setSent(true) });
  }

  return (
    <>
      <CardHeader className="gap-2 px-0 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Account recovery</p>
        <CardTitle className="text-2xl tracking-tight text-slate-950">Forgot your password?</CardTitle>
        <CardDescription>Enter the email address on your account and we’ll send a one-time reset code.</CardDescription>
      </CardHeader>
      <CardContent className="mt-6 px-0">
        {sent ? (
          <div className="space-y-4">
            <Alert variant="success">
              <AlertDescription>
                If an active account matches that email, you&apos;ll receive a 6-digit code. Check your inbox.
              </AlertDescription>
            </Alert>
            <LinkButton href="/reset-password" className="h-11 w-full text-sm">Enter reset code</LinkButton>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <AuthField name="email" type="email" label="Email address" autoComplete="email" placeholder="you@company.com" required error={fieldErrors.email} />
            <AuthSubmitButton pending={forgotPassword.isPending}>Send reset code</AuthSubmitButton>
          </form>
        )}
      </CardContent>
      <CardFooter className="mt-6 justify-center px-0">
        <Link href="/login" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Back to sign in</Link>
      </CardFooter>
    </>
  );
}
