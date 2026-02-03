/**
 * Client-safe exports from @acme/api
 *
 * This module contains only exports that are safe to use in client components.
 * It does NOT include any server-side dependencies (database, tRPC router, etc.)
 *
 * Use this import in client components:
 *   import { NUTRIENT_REGISTRY, ... } from "@acme/api/client";
 *
 * Use the main "@acme/api" import only in server components and API routes.
 */

// Types and schemas (no runtime dependencies)
export * from "./router/food.schema";

// Pure utility functions and constants
export * from "./lib/clinical-calculator";
export * from "./lib/nutrients/registry";
