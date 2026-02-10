import type { LucideIcon } from "lucide-react";
import { Droplets, PieChart, TrendingUp, Wine } from "lucide-react";
import type { ComponentType } from "react";
import { BACWidget } from "./bac-widget";
import { HydrationWidget } from "./hydration-widget";
import { MacroSummaryWidget } from "./macro-summary-widget";
import { WeightTrendWidget } from "./weight-trend-widget";

export interface WidgetDefinition {
	id: string;
	name: string;
	description: string;
	icon: LucideIcon;
	component: ComponentType<{ date: Date }>;
}

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
	"macro-summary": {
		id: "macro-summary",
		name: "Macro Summary",
		description: "Protein, carbs & fat breakdown for the day",
		icon: PieChart,
		component: MacroSummaryWidget,
	},
	hydration: {
		id: "hydration",
		name: "Hydration",
		description: "Track daily water intake with quick-add buttons",
		icon: Droplets,
		component: HydrationWidget,
	},
	"weight-trend": {
		id: "weight-trend",
		name: "Weight Trend",
		description: "30-day weight history sparkline",
		icon: TrendingUp,
		component: WeightTrendWidget,
	},
	"bac-estimate": {
		id: "bac-estimate",
		name: "BAC Estimate",
		description: "Estimated Blood Alcohol Content based on logged intake",
		icon: Wine,
		component: BACWidget,
	},
};

export const DEFAULT_WIDGETS = [
	{ id: "macro-summary", order: 0 },
	{ id: "hydration", order: 1 },
	{ id: "weight-trend", order: 2 },
];
