import { relations, sql } from "drizzle-orm";
import { index, sqliteTable } from "drizzle-orm/sqlite-core";

/**
 * Multi-project schema prefix helper
 */

// Better Auth core tables
export const user = sqliteTable("user", (d) => ({
  id: d
    .text({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.text({ length: 255 }),
  email: d.text({ length: 255 }).notNull().unique(),
  emailVerified: d.integer({ mode: "boolean" }).default(false),
  image: d.text({ length: 255 }),
  createdAt: d
    .integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  // Clinical/Profile Fields
  sex: d.text({ length: 10 }), // 'male' | 'female' | 'other'
  birthDate: d.integer({ mode: "timestamp" }),
  height: d.real(), // cm
  weight: d.real(), // kg
  activityLevel: d.text({ length: 20 }), // 'sedentary', 'active', etc.
  goals: d
    .text({ mode: "json" })
    .$type<Record<string, { target?: number; min?: number; max?: number }>>(), // Custom nutrient goals
  dashboardConfig: d
    .text({ mode: "json" })
    .$type<{ widgets: { id: string; order: number }[] }>(),
  // Onboarding
  onboardingProfile: d.text({ mode: "json" }).$type<OnboardingProfile>(),
  onboardedAt: d.integer({ mode: "timestamp" }),
}));

export interface OnboardingProfile {
  unitSystem: "metric" | "imperial";
  bodyFatPercent?: number;
  goalType: "lose" | "maintain" | "gain";
  targetWeight: number;
  rateOfChange: number;
  intakeKnowledge: "none" | "rough" | "precise";
  weightTrend: "losing" | "stable" | "gaining";
  highestWeight: number;
  menstrualTracking: boolean;
  sleepQuality: "poor" | "fair" | "good" | "excellent";
  trainingExperience: "beginner" | "intermediate" | "advanced";

  exerciseFrequency: number;
  dietType:
    | "standard"
    | "vegetarian"
    | "vegan"
    | "keto"
    | "low_fat"
    | "low_carb";
  proteinTarget: number;
  macroDistribution: {
    carbPercent: number;
    proteinPercent: number;
    fatPercent: number;
  };
  calorieShifting: {
    type: "uniform" | "manual" | "training_based";
    dayConfig?: Record<string, "high" | "low" | "normal">;
    highDayPercent?: number;
    lowDayPercent?: number;
  };
  checkInDay:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
}

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),

  customFoods: many(customFood),
  dailyLogs: many(dailyLog),
  weightLogs: many(weightLog),
}));

export const account = sqliteTable(
  "account",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id),
    accountId: d.text({ length: 255 }).notNull(),
    providerId: d.text({ length: 255 }).notNull(),
    accessToken: d.text(),
    refreshToken: d.text(),
    accessTokenExpiresAt: d.integer({ mode: "timestamp" }),
    refreshTokenExpiresAt: d.integer({ mode: "timestamp" }),
    scope: d.text({ length: 255 }),
    idToken: d.text(),
    password: d.text(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const session = sqliteTable(
  "session",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id),
    token: d.text({ length: 255 }).notNull().unique(),
    expiresAt: d.integer({ mode: "timestamp" }).notNull(),
    ipAddress: d.text({ length: 255 }),
    userAgent: d.text({ length: 255 }),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const verification = sqliteTable(
  "verification",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    identifier: d.text({ length: 255 }).notNull(),
    value: d.text({ length: 255 }).notNull(),
    expiresAt: d.integer({ mode: "timestamp" }).notNull(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const customFood = sqliteTable(
  "custom_food",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: d.text({ length: 256 }).notNull(),
    brand: d.text({ length: 256 }),
    nutriments: d.text({ mode: "json" }).$type<Record<string, unknown>>(), // Storing JSON stringified
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("custom_food_user_idx").on(t.userId)],
);

export const customFoodRelations = relations(customFood, ({ one }) => ({
  user: one(user, { fields: [customFood.userId], references: [user.id] }),
}));

export const dailyLog = sqliteTable(
  "daily_log",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: d.text({ length: 12 }).notNull(), // YYYY-MM-DD
    foodCode: d.text({ length: 256 }),
    foodName: d.text({ length: 256 }).notNull(),
    foodBrand: d.text({ length: 256 }),
    quantity: d.real().notNull(),
    unit: d.text({ length: 50 }).notNull(),
    nutrients: d.text({ mode: "json" }).$type<Record<string, number>>(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("daily_log_user_date_idx").on(t.userId, t.date)],
);

export const dailyLogRelations = relations(dailyLog, ({ one }) => ({
  user: one(user, { fields: [dailyLog.userId], references: [user.id] }),
}));

export const weightLog = sqliteTable(
  "weight_log",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: d.text({ length: 12 }).notNull(), // YYYY-MM-DD
    weight: d.real().notNull(), // kg
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [index("weight_log_user_date_idx").on(t.userId, t.date)],
);

export const weightLogRelations = relations(weightLog, ({ one }) => ({
  user: one(user, { fields: [weightLog.userId], references: [user.id] }),
}));
