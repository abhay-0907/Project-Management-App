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
      className={cn("h-11 w-full text-sm", className)}
    >
      {pending ? "Please wait…" : children}
    </Button>
  );
}
