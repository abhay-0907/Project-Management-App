"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { LinkButton } from "@/components/ui/button";
import { useLandingAuthenticated } from "./landing-auth";

type Props = Omit<ComponentProps<typeof LinkButton>, "href" | "className" | "variant" | "size" | "children"> & {
  variant?: "primary" | "secondary";
  className?: string;
};

export function LandingAction({ variant = "primary", className = "", ...props }: Props) {
  const isAuthenticated = useLandingAuthenticated();

  return (
    <LinkButton
      href={isAuthenticated ? "/workspaces" : "/register"}
      variant={variant === "primary" ? "default" : "outline"}
      size="lg"
      className={`landing-button landing-button-${variant} ${className}`.trim()}
      {...props}
    >
      {isAuthenticated ? "Open Workspace" : "Get Started"}
    </LinkButton>
  );
}

export function LandingAccountLinks() {
  const isAuthenticated = useLandingAuthenticated();

  return (
    <>
      <Link className="landing-footer-account-link" href={isAuthenticated ? "/workspaces" : "/login"}>
        {isAuthenticated ? "Your Workspaces" : "Log In"}
      </Link>
      <Link className="landing-footer-account-link" href={isAuthenticated ? "/workspaces" : "/register"}>
        {isAuthenticated ? "Open Workspace" : "Get Started"}
      </Link>
    </>
  );
}
