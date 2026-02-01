import { createTRPCRouter } from "../trpc";
import {
  deleteLog,
  getById,
  getDailyLogs,
  getDailyNutrition,
  logFoods,
  search,
  updateGoals,
  updateProfile,
} from "./food/index";

// ─────────────────────────────────────────────────────────────────────────────
// Router Definition
// ─────────────────────────────────────────────────────────────────────────────

export const foodRouter = createTRPCRouter({
  search,
  getById,
  logFoods,
  getDailyNutrition,
  getDailyLogs,
  deleteLog,
  updateProfile,
  updateGoals,
});
