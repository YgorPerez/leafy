import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./root";

/**
 * Inference helpers for input types
 * @example
 * type PostByIdInput = RouterInputs['post']['byId']
 *      ^? { id: number }
 */
type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type AllPostsOutput = RouterOutputs['post']['all']
 *      ^? Post[]
 */
type RouterOutputs = inferRouterOutputs<AppRouter>;

export * from "./lib/clinical-calculator";
export * from "./lib/nutrients/registry";
export { appRouter, createCaller, type AppRouter } from "./root";
export * from "./router/food.schema";
export { createTRPCContext } from "./trpc";
export type { RouterInputs, RouterOutputs };
