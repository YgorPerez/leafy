import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// Get Convex URL from environment
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.warn(
    "EXPO_PUBLIC_CONVEX_URL not set. Convex features will be disabled.",
  );
}

/**
 * Convex client instance.
 * Initialize only if URL is available.
 */
export const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

/**
 * Convex provider wrapper for the app.
 * Safely handles missing Convex configuration.
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    // Convex not configured, render children without provider
    return <>{children}</>;
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
