import { Suspense } from "react";
import { RegisterForm } from "@/features/auth/components/register-form";
import { AuthFormLoading } from "@/features/auth/components/auth-form-loading";
import { getSafeNextPath } from "@/features/auth/utils/auth.utils";

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  return (
    <Suspense fallback={<AuthFormLoading />}>
      <RegisterPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function RegisterPageContent({
  searchParams,
}: RegisterPageProps) {
  const { next } = await searchParams;
  return <RegisterForm nextPath={getSafeNextPath(typeof next === "string" ? next : null)} />;
}
