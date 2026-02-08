import { relations } from "drizzle-orm/relations";
import { user, account, customFood, dailyLog, session, weightLog } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	customFoods: many(customFood),
	dailyLogs: many(dailyLog),
	sessions: many(session),
	weightLogs: many(weightLog),
}));

export const customFoodRelations = relations(customFood, ({one}) => ({
	user: one(user, {
		fields: [customFood.userId],
		references: [user.id]
	}),
}));

export const dailyLogRelations = relations(dailyLog, ({one}) => ({
	user: one(user, {
		fields: [dailyLog.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const weightLogRelations = relations(weightLog, ({one}) => ({
	user: one(user, {
		fields: [weightLog.userId],
		references: [user.id]
	}),
}));