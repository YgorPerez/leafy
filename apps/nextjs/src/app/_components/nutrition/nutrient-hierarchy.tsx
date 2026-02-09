"use client";

import type { CanonicalNutrientKey, DRIMetrics } from "@acme/api/client";
import { getClinicalValue, NUTRIENT_REGISTRY } from "@acme/api/client";

import type { Goal } from "~/app/_hooks/use-nutrition-goals";
import { HIERARCHY } from "~/app/_hooks/use-nutrition-goals";
import { NutrientRow } from "./nutrient-row";

interface NutrientHierarchyProps {
	itemKey: string;
	metrics: DRIMetrics;
	goals: Record<string, Goal>;
	intake?: Record<string, number>;
	onEdit: (
		key: string,
		currentVal: Goal,
		refVal?: { recommended: number; unit: string },
	) => void;
	onRowClick?: (key: string) => void;
	depth?: number;
}

export function NutrientHierarchy({
	itemKey,
	metrics,
	goals,
	intake,
	onEdit,
	onRowClick,
	depth = 0,
}: NutrientHierarchyProps) {
	const meta = NUTRIENT_REGISTRY[itemKey as CanonicalNutrientKey];
	if (!meta) return null;

	const children = HIERARCHY[itemKey];

	return (
		<div
			className={
				depth > 0
					? depth === 1
						? "my-2 space-y-1 border-l border-white/10 pl-4"
						: "ml-4 border-l border-white/5 pl-4"
					: "space-y-1"
			}
		>
			<NutrientRow
				goals={goals}
				indent={depth > 0}
				intake={intake}
				itemKey={itemKey}
				label={meta.label}
				onEdit={onEdit}
				onRowClick={onRowClick}
				value={{
					recommended: getClinicalValue(
						metrics,
						itemKey as CanonicalNutrientKey,
					),
					unit: meta.unit,
				}}
			/>
			{children?.map((childKey) => (
				<NutrientHierarchy
					key={childKey}
					goals={goals}
					intake={intake}
					itemKey={childKey}
					metrics={metrics}
					onEdit={onEdit}
					onRowClick={onRowClick}
					depth={depth + 1}
				/>
			))}
		</div>
	);
}
