"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import type { User } from "@/features/auth/types/auth.types";

type LandingAuthState = {
  user: User | null;
  isLoading: boolean;
};

const LandingAuthContext = createContext<LandingAuthState>({ user: null, isLoading: true });

export function LandingAuthProvider({ children }: { children: ReactNode }) {
  const currentUser = useCurrentUser();

  return (
    <LandingAuthContext.Provider value={{ user: currentUser.data ?? null, isLoading: currentUser.isLoading }}>
      {children}
    </LandingAuthContext.Provider>
  );
}

export function useLandingAuth() {
  return useContext(LandingAuthContext);
}

export function useLandingAuthenticated() {
  return Boolean(useLandingAuth().user);
}
