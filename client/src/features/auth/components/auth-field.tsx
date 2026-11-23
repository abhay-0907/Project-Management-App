import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function AuthField({ label, error, id, className = "", ...props }: AuthFieldProps) {
  const inputId = id ?? props.name;
  const errorId = inputId ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-2">
      {label ? (
        <Label htmlFor={inputId} className="text-foreground">
          {label}
        </Label>
      ) : null}
      <Input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={className}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-body-sm text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
