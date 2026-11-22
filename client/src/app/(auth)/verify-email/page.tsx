import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

interface VerifyEmailPageProps {
  searchParams: Promise<{ email?: string | string[] }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  return <VerifyEmailForm initialEmail={email} />;
}
