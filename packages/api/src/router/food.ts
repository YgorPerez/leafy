import { createTRPCRouter } from "../trpc";
import {
  deleteLog,
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
  search,
  getById,
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
