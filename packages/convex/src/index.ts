/**
 * @acme/convex - Convex backend for real-time data sync
 *
 * This package provides:
 * - Convex schema definitions
 * - Client configuration
 *
 * To initialize Convex:
 * 1. Create a Convex account at https://dashboard.convex.dev
 * 2. Run `npx convex dev` to start the Convex dev server
 * 3. This will generate types in the `convex/_generated` folder
 */

// Schema will be imported from the convex folder after initialization
// Re-export the Convex URL constant
export const CONVEX_URL =
  process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
