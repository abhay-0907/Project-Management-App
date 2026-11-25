import { Skeleton } from "@/components/ui/skeleton";

export function AuthFormLoading() {
  return (
    <div role="status" aria-label="Loading authentication form" className="space-y-5 py-1">
      <Skeleton className="mx-auto h-3 w-28" />
      <Skeleton className="mx-auto h-8 w-48" />
      <Skeleton className="mx-auto h-4 w-64" />
      <div className="space-y-4 pt-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="mx-auto h-4 w-48" />
    </div>
  );
}
