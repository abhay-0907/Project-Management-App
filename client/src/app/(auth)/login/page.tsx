import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import { AuthFormLoading } from "@/features/auth/components/auth-form-loading";
import { getSafeNextPath } from "@/features/auth/utils/auth.utils";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense fallback={<AuthFormLoading />}>
      <LoginPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginPageContent({
  searchParams,
}: LoginPageProps) {
  const { next } = await searchParams;
  return <LoginForm nextPath={getSafeNextPath(typeof next === "string" ? next : null)} />;
}
