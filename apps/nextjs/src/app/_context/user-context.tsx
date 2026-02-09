"use client";

import type { DRIMetrics } from "@acme/api/client";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";

interface DashboardConfig {
	widgets: Array<{ id: string; order: number }>;
}

interface UserContextValue {
	metrics: DRIMetrics | null;
	customGoals:
		| Record<string, { target?: number; min?: number; max?: number }>
		| undefined;
	dashboardConfig: DashboardConfig | null;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({
	children,
	metrics,
	customGoals,
	dashboardConfig,
}: {
	children: ReactNode;
	metrics: DRIMetrics | null;
	customGoals:
		| Record<string, { target?: number; min?: number; max?: number }>
		| undefined;
	dashboardConfig: DashboardConfig | null;
}) {
	return (
		<UserContext.Provider value={{ metrics, customGoals, dashboardConfig }}>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error("useUser must be used within a UserProvider");
	}
	return context;
}
