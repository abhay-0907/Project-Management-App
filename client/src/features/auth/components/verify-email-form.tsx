"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyEmailSchema } from "../schemas/auth.schema";
import { useResendVerification, useVerifyEmail } from "../hooks/use-email-verification";
import { getFirstFieldErrors } from "../utils/auth.utils";
import { AuthField } from "./auth-field";
import { AuthSubmitButton } from "./auth-submit-button";

export function VerifyEmailForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const verifyEmail = useVerifyEmail();
  const resendVerification = useResendVerification();
  const [email, setEmail] = useState(initialEmail);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = verifyEmailSchema.safeParse({
      email: String(form.get("email") ?? ""),
      otp: String(form.get("otp") ?? ""),
    });
    if (!parsed.success) {
      setFieldErrors(getFirstFieldErrors(parsed.error.flatten()));
      return;
    }
    setFieldErrors({});
    verifyEmail.mutate(parsed.data, { onSuccess: () => router.replace("/login") });
  }

  function handleResend() {
    resendVerification.mutate({ email });
  }

  return (
    <>
      <CardHeader className="gap-2 px-0 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">One last step</p>
        <CardTitle className="text-2xl tracking-tight text-slate-950">Verify your email</CardTitle>
        <CardDescription>Enter the 6-digit code we sent you. It expires in 5 minutes.</CardDescription>
      </CardHeader>
      <CardContent className="mt-6 px-0">
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <AuthField name="email" type="email" label="Email address" autoComplete="email" placeholder="you@company.com" required value={email} onChange={(event) => setEmail(event.target.value)} error={fieldErrors.email} />
        <AuthField name="otp" type="text" label="Verification code" autoComplete="one-time-code" inputMode="numeric" maxLength={6} placeholder="123456" required error={fieldErrors.otp} />
        <AuthSubmitButton pending={verifyEmail.isPending}>Verify email</AuthSubmitButton>
      </form>
      </CardContent>
      <CardFooter className="mt-5 flex-col justify-center gap-3 px-0">
        <Button type="button" variant="link" size="default" isDisabled={!email || resendVerification.isPending} onPress={handleResend}>
          {resendVerification.isPending ? "Sending code…" : "Resend verification code"}
        </Button>
        <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700">Back to sign in</Link>
      </CardFooter>
    </>
  );
}
