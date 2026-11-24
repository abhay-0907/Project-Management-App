"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();

  return <VerifyEmailForm initialEmail={searchParams.get("email") ?? ""} nextPath={searchParams.get("next")} />;
}

function VerifyEmailLoading() {
  return (
    <div role="status" aria-label="Loading email verification form" className="space-y-5 py-1">
      <Skeleton className="mx-auto h-3 w-28" />
      <Skeleton className="mx-auto h-8 w-48" />
      <Skeleton className="mx-auto h-4 w-64" />
      <Skeleton className="mt-7 h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
