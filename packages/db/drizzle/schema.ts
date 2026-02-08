import { sqliteTable, AnySQLiteColumn, index, foreignKey, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const account = sqliteTable("account", {
	id: text({ length: 255 }).primaryKey().notNull(),
	userId: text("user_id", { length: 255 }).notNull().references(() => user.id),
	accountId: text("account_id", { length: 255 }).notNull(),
	providerId: text("provider_id", { length: 255 }).notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	accessTokenExpiresAt: integer("access_token_expires_at"),
	refreshTokenExpiresAt: integer("refresh_token_expires_at"),
	scope: text({ length: 255 }),
	idToken: text("id_token"),
	password: text(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at"),
},
(table) => [
	index("account_user_id_idx").on(table.userId),
]);

export const customFood = sqliteTable("custom_food", {
	id: text({ length: 255 }).primaryKey().notNull(),
	userId: text("user_id", { length: 255 }).notNull().references(() => user.id, { onDelete: "cascade" } ),
	name: text({ length: 256 }).notNull(),
	brand: text({ length: 256 }),
	nutriments: text(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at"),
},
(table) => [
	index("custom_food_user_idx").on(table.userId),
]);

export const dailyLog = sqliteTable("daily_log", {
	id: text({ length: 255 }).primaryKey().notNull(),
	userId: text("user_id", { length: 255 }).notNull().references(() => user.id, { onDelete: "cascade" } ),
	date: text({ length: 12 }).notNull(),
	foodCode: text("food_code", { length: 256 }),
	foodName: text("food_name", { length: 256 }).notNull(),
	foodBrand: text("food_brand", { length: 256 }),
	quantity: real().notNull(),
	unit: text({ length: 50 }).notNull(),
	nutrients: text(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at"),
},
(table) => [
	index("daily_log_user_date_idx").on(table.userId, table.date),
]);

export const session = sqliteTable("session", {
	id: text({ length: 255 }).primaryKey().notNull(),
	userId: text("user_id", { length: 255 }).notNull().references(() => user.id),
	token: text({ length: 255 }).notNull(),
	expiresAt: integer("expires_at").notNull(),
	ipAddress: text("ip_address", { length: 255 }),
	userAgent: text("user_agent", { length: 255 }),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at"),
},
(table) => [
	index("session_user_id_idx").on(table.userId),
	uniqueIndex("session_token_unique").on(table.token),
]);

export const user = sqliteTable("user", {
	id: text({ length: 255 }).primaryKey().notNull(),
	name: text({ length: 255 }),
	email: text({ length: 255 }).notNull(),
	emailVerified: integer("email_verified").default(false),
	image: text({ length: 255 }),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at"),
	sex: text({ length: 10 }),
	birthDate: integer("birth_date"),
	height: real(),
	weight: real(),
	activityLevel: text("activity_level", { length: 20 }),
	goals: text(),
	dashboardConfig: text("dashboard_config"),
},
(table) => [
	uniqueIndex("user_email_unique").on(table.email),
]);

export const verification = sqliteTable("verification", {
	id: text({ length: 255 }).primaryKey().notNull(),
	identifier: text({ length: 255 }).notNull(),
	value: text({ length: 255 }).notNull(),
	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at"),
},
(table) => [
	index("verification_identifier_idx").on(table.identifier),
]);

export const weightLog = sqliteTable("weight_log", {
	id: text({ length: 255 }).primaryKey().notNull(),
	userId: text("user_id", { length: 255 }).notNull().references(() => user.id, { onDelete: "cascade" } ),
	date: text({ length: 12 }).notNull(),
	weight: real().notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
},
(table) => [
	index("weight_log_user_date_idx").on(table.userId, table.date),
]);

