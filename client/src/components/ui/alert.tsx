import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-3.5 [&>svg]:text-current [&>svg+div]:translate-y-[-3px] [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "border-destructive/40 bg-destructive/5 text-destructive",
        success: "border-emerald-200 bg-emerald-50 text-emerald-900",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

function Alert({ className, variant, role, ...props }: AlertProps) {
  return (
    <div
      role={role ?? (variant === "destructive" ? "alert" : "status")}
      data-slot="alert"
      data-variant={variant ?? "default"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h5 data-slot="alert-title" className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />;
}

function AlertDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="alert-description" className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />;
}

export { Alert, AlertDescription, AlertTitle, alertVariants };
