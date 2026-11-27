import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthSubmitButtonProps extends ComponentProps<typeof Button> {
  pending?: boolean;
  children: ReactNode;
}

export function AuthSubmitButton({ pending, children, isDisabled, className, ...props }: AuthSubmitButtonProps) {
  return (
    <Button
      {...props}
      type="submit"
      size="lg"
      isDisabled={pending || isDisabled}
      aria-busy={pending || undefined}
      className={cn(
        "h-11 w-full bg-indigo-600 text-body text-white hover:bg-indigo-700 focus-visible:border-indigo-700 focus-visible:ring-indigo-600/35 disabled:cursor-not-allowed disabled:bg-indigo-700 disabled:text-white disabled:opacity-100 aria-busy:cursor-wait aria-busy:bg-indigo-700 aria-busy:text-white",
        className,
      )}
    >
      {pending ? "Please wait…" : children}
    </Button>
  );
}
