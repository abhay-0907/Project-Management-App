import { LoginForm } from "@/features/auth/components/login-form";
import { getSafeNextPath } from "@/features/auth/utils/auth.utils";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { next } = await searchParams;
  return <LoginForm nextPath={getSafeNextPath(typeof next === "string" ? next : null)} />;
}
