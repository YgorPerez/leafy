import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex schema definition for the Leafy app.
 * This defines the structure of your Convex database tables.
 *
 * @see https://docs.convex.dev/database/schemas
 */
export default defineSchema({
  /**
   * User profiles - synced from auth provider
   */
  users: defineTable({
    /** Auth provider user ID (e.g., from better-auth) */
    authId: v.string(),
    /** User's display name */
    name: v.optional(v.string()),
    /** User's email */
    email: v.optional(v.string()),
    /** Profile image URL */
    imageUrl: v.optional(v.string()),
    /** Account creation timestamp */
    createdAt: v.number(),
  }).index("by_auth_id", ["authId"]),

  /**
   * Food log entries - real-time synced across devices
   */
  foodLogs: defineTable({
    /** User who logged the food */
    userId: v.id("users"),
    /** Date of the log (YYYY-MM-DD) */
    date: v.string(),
    /** Food ID from the local database */
    foodId: v.string(),
    /** Food name for display */
    foodName: v.string(),
    /** Serving amount */
    amount: v.number(),
    /** Serving unit */
    unit: v.string(),
    /** Meal type */
    mealType: v.optional(
      v.union(
        v.literal("breakfast"),
        v.literal("lunch"),
        v.literal("dinner"),
        v.literal("snack"),
      ),
    ),
    /** Timestamp when logged */
    loggedAt: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user", ["userId"]),

  /**
   * User nutrition targets
   */
  nutritionTargets: defineTable({
    userId: v.id("users"),
    nutrientKey: v.string(),
    minValue: v.optional(v.number()),
    maxValue: v.optional(v.number()),
    targetValue: v.optional(v.number()),
    unit: v.string(),
  }).index("by_user", ["userId"]),
});
