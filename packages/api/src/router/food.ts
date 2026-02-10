import { createTRPCRouter } from "../trpc";
import {
  completeOnboarding,
  deleteLog,
  getBAC,
  getById,
  getDailyLogs,
  getDailyNutrition,
  getWaterIntake,
  getWeightHistory,
  logFoods,
  logWater,
  logWeight,
  search,
  updateDashboardConfig,
  updateGoals,
  updateLog,
  updateProfile,
} from "./food/index";

// ─────────────────────────────────────────────────────────────────────────────
// Router Definition
// ─────────────────────────────────────────────────────────────────────────────

export const foodRouter = createTRPCRouter({
  completeOnboarding,
  search,
  getById,
  getBAC,
  logFoods,
  getDailyNutrition,
  getDailyLogs,
  deleteLog,
  updateLog,
  updateProfile,
  updateGoals,
  updateDashboardConfig,
  logWater,
  getWaterIntake,
  logWeight,
  getWeightHistory,
});
