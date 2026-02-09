import { authRouter } from "./router/auth";
import { dayRouter } from "./router/day";
import { foodRouter } from "./router/food";
import { mealRouter } from "./router/meal";
import { createCallerFactory, createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  day: dayRouter,
  food: foodRouter,
  meal: mealRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
