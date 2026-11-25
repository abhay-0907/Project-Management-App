import { RegisterForm } from "@/features/auth/components/register-form";
import { getSafeNextPath } from "@/features/auth/utils/auth.utils";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { next } = await searchParams;
  return <RegisterForm nextPath={getSafeNextPath(typeof next === "string" ? next : null)} />;
}
