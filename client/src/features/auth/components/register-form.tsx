"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { registerSchema } from "../schemas/auth.schema";
import { useRegister } from "../hooks/use-register";
import { getFirstFieldErrors, getSafeNextPath } from "../utils/auth.utils";
import { AuthField } from "./auth-field";
import { AuthSubmitButton } from "./auth-submit-button";

export function RegisterForm() {
  const router = useRouter();
  const register = useRegister();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    setNextPath(getSafeNextPath(new URLSearchParams(window.location.search).get("next")));
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (!parsed.success) {
      setFieldErrors(getFirstFieldErrors(parsed.error.flatten()));
      return;
    }
    setFieldErrors({});
    const next = getSafeNextPath(new URLSearchParams(window.location.search).get("next"));
    register.mutate(parsed.data, {
      onSuccess: () => router.push(`/verify-email?email=${encodeURIComponent(parsed.data.email)}${next ? `&next=${encodeURIComponent(next)}` : ""}`),
    });
  }

  return (
    <>
      <CardHeader className="gap-2 px-0 text-center">
        <p className="text-caption font-semibold uppercase tracking-[0.18em] text-indigo-600">Get started</p>
        <CardTitle className="text-page-title tracking-tight text-slate-950">Create your account</CardTitle>
        <CardDescription>Bring your team and projects together.</CardDescription>
      </CardHeader>
      <CardContent className="mt-6 px-0">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <AuthField name="name" type="text" label="Full name" autoComplete="name" placeholder="Alex Morgan" required error={fieldErrors.name} />
        <AuthField name="email" type="email" label="Email address" autoComplete="email" placeholder="you@company.com" required error={fieldErrors.email} />
        <AuthField name="password" type="password" label="Password" autoComplete="new-password" placeholder="At least 8 characters" required error={fieldErrors.password} />
        <p className="-mt-2 text-caption leading-5 text-slate-500">Use 8–128 characters. We’ll email you a code to verify your address.</p>
        <AuthSubmitButton pending={register.isPending}>Create account</AuthSubmitButton>
      </form>
      </CardContent>
      <CardFooter className="mt-6 justify-center px-0">
      <p className="text-center text-body text-slate-600">
        Already have an account? <Link href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"} className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</Link>
      </p>
      </CardFooter>
    </>
  );
}
