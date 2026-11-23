"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/shared/icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { LandingAction } from "./landing-action";
import { useLandingAuth } from "./landing-auth";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "About", href: "#about" },
];

export function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isLoading } = useLandingAuth();
  const logout = useLogout();
  const router = useRouter();

  function closeMenu() {
    setMenuOpen(false);
  }

  async function signOut() {
    try {
      await logout.mutateAsync();
      router.replace("/");
    } catch {
      // useLogout reports the API error and leaves the authenticated state intact.
    }
  }

  return (
    <header className="landing-header">
      <div className="landing-container landing-nav-inner">
        <Link className="landing-brand" href="/" aria-label="Nexora home">
          <span className="landing-brand-mark" aria-hidden="true">n</span>
          <span>Nexora</span>
        </Link>

        {isLoading ? (
          <div className="landing-auth-loading" role="status" aria-label="Checking sign-in status">
            <Skeleton className="landing-navbar-skeleton" aria-hidden="true" />
          </div>
        ) : user ? (
          <DropdownMenuTrigger>
            <Button
              variant="outline"
              size="lg"
              className="landing-auth-trigger"
              aria-label={`Open account menu for ${user.name}`}
            >
              <Avatar className="landing-auth-avatar">
                <AvatarFallback className="landing-auth-avatar-fallback">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="landing-auth-name">{user.name}</span>
              <Icon name="chevron-down" size={15} />
            </Button>
            <DropdownMenu placement="bottom end" className="landing-auth-dropdown">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="landing-auth-user-info">
                  <span className="landing-auth-user-name">{user.name}</span>
                  <span className="landing-auth-user-email">{user.email}</span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="landing-auth-menu-item"
                onAction={() => router.push("/workspaces")}
              >
                <Icon name="layers" size={16} />
                My Workspaces
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="landing-auth-menu-item"
                variant="destructive"
                isDisabled={logout.isPending}
                onAction={signOut}
              >
                <Icon name="logout" size={16} />
                {logout.isPending ? "Signing out" : "Log out"}
              </DropdownMenuItem>
            </DropdownMenu>
          </DropdownMenuTrigger>
        ) : (
          <>
            <nav
              className={`landing-navigation${menuOpen ? " is-open" : ""}`}
              id="landing-navigation"
              aria-label="Main navigation"
            >
              <div className="landing-nav-links">
                {navItems.map((item) => (
                  <a href={item.href} key={item.href} onClick={closeMenu}>
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="landing-nav-actions">
                <Link className="landing-login-link" href="/login" onClick={closeMenu}>
                  Log In
                </Link>
                <LandingAction onPress={closeMenu} />
              </div>
            </nav>

            <Button
              variant="outline"
              size="icon-lg"
              className="landing-menu-toggle"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="landing-navigation"
              onPress={() => setMenuOpen((open) => !open)}
            >
              <Icon name={menuOpen ? "close" : "menu"} size={21} />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toUpperCase();

  return initials || "?";
}
