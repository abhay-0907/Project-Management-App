"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { loginSchema } from "../schemas/auth.schema";
import { useLogin } from "../hooks/use-login";
import { getFirstFieldErrors, getSafeNextPath } from "../utils/auth.utils";
import { AuthField } from "./auth-field";
import { AuthSubmitButton } from "./auth-submit-button";

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    setNextPath(getSafeNextPath(new URLSearchParams(window.location.search).get("next")));
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (!parsed.success) {
      setFieldErrors(getFirstFieldErrors(parsed.error.flatten()));
      return;
    }
    setFieldErrors({});
    const next = getSafeNextPath(new URLSearchParams(window.location.search).get("next"));
    login.mutate(parsed.data, {
      onSuccess: () => {
        router.replace(next ?? "/workspaces");
        router.refresh();
      },
    });
  }

  return (
    <>
      <CardHeader className="gap-2 px-0 text-center">
        <p className="text-caption font-semibold uppercase tracking-[0.18em] text-indigo-600">Welcome back</p>
        <CardTitle className="text-page-title tracking-tight text-slate-950">Sign in to Nexora</CardTitle>
        <CardDescription>Pick up where your team left off.</CardDescription>
      </CardHeader>
      <CardContent className="mt-6 px-0">
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <AuthField name="email" type="email" label="Email address" autoComplete="email" placeholder="you@company.com" required error={fieldErrors.email} />
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-body font-medium text-indigo-600 hover:text-indigo-700">Forgot password?</Link>
          </div>
          <AuthField id="password" name="password" type="password" label="" autoComplete="current-password" placeholder="Your password" required error={fieldErrors.password} className="-mt-2" />
        </div>
        <AuthSubmitButton pending={login.isPending}>Sign in</AuthSubmitButton>
      </form>
      </CardContent>
      <CardFooter className="mt-6 justify-center px-0">
      <p className="text-center text-body text-slate-600">
        New to Nexora? <Link href={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : "/register"} className="font-semibold text-indigo-600 hover:text-indigo-700">Create an account</Link>
      </p>
      </CardFooter>
    </>
  );
}
