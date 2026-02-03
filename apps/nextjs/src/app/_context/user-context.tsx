"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import { type DRIMetrics } from "@acme/api/client";

interface UserContextValue {
  metrics: DRIMetrics | null;
  customGoals:
    | Record<string, { target?: number; min?: number; max?: number }>
    | undefined;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({
  children,
  metrics,
  customGoals,
}: {
  children: ReactNode;
  metrics: DRIMetrics | null;
  customGoals:
    | Record<string, { target?: number; min?: number; max?: number }>
    | undefined;
}) {
  return (
    <UserContext.Provider value={{ metrics, customGoals }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
