"use client";

import type { CanonicalNutrientKey } from "@acme/api/client";
import { NUTRIENT_REGISTRY, normalizeToCanonicalKey } from "@acme/api/client";
import { useMemo } from "react";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface NutrientBreakdownDialogProps {
	nutrientKey: string | null;
	date: string;
	onClose: () => void;
}

export function NutrientBreakdownDialog({
	nutrientKey,
	date,
	onClose,
}: NutrientBreakdownDialogProps) {
	const { data: logs } = api.food.getDailyLogs.useQuery(
		{ date },
		{ enabled: !!nutrientKey },
	);

	const meta = nutrientKey
		? NUTRIENT_REGISTRY[nutrientKey as CanonicalNutrientKey]
		: null;

	const contributions = useMemo(() => {
		if (!nutrientKey || !logs) return [];

		return logs
			.map((log) => {
				const nutrients = log.nutrients as Record<string, number> | null;
				let amount = 0;

				if (nutrients) {
					for (const [key, val] of Object.entries(nutrients)) {
						if (normalizeToCanonicalKey(key) === nutrientKey) {
							amount += Number(val) || 0;
						}
					}
				}

				return {
					id: log.id,
					foodName: log.foodName,
					foodBrand: log.foodBrand,
					quantity: log.quantity,
					unit: log.unit,
					amount,
				};
			})
			.filter((c) => c.amount > 0)
			.sort((a, b) => b.amount - a.amount);
	}, [nutrientKey, logs]);

	const total = contributions.reduce((sum, c) => sum + c.amount, 0);
	const maxAmount = contributions[0]?.amount ?? 0;

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={!!nutrientKey}>
			<DialogContent className="max-h-[85vh] overflow-hidden border-white/10 bg-[#0c0c0c] p-0 sm:max-w-md">
				<DialogHeader className="border-b border-white/5 p-6 pb-4">
					<DialogTitle className="text-2xl font-bold text-white">
						{meta?.label ?? nutrientKey}
					</DialogTitle>
					{total > 0 && (
						<p className="text-muted-foreground mt-1 font-mono text-sm">
							{total.toFixed(total < 1 ? 2 : 1)}{" "}
							<span className="text-[10px] font-medium tracking-wider uppercase">
								{meta?.unit}
							</span>{" "}
							from {contributions.length} food
							{contributions.length !== 1 ? "s" : ""}
						</p>
					)}
				</DialogHeader>

				<div className="custom-scrollbar max-h-[65vh] overflow-y-auto p-6 pt-2">
					{contributions.length === 0 ? (
						<p className="text-muted-foreground py-8 text-center text-sm italic">
							No logged foods contribute to this nutrient today.
						</p>
					) : (
						<div className="space-y-1">
							{contributions.map((c) => {
								const pct = total > 0 ? (c.amount / total) * 100 : 0;
								const barWidth =
									maxAmount > 0 ? (c.amount / maxAmount) * 100 : 0;

								return (
									<div
										key={c.id}
										className="group rounded-lg px-1 py-2.5 transition-colors hover:bg-white/[0.03]"
									>
										<div className="flex items-center justify-between gap-3">
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium text-white/90">
													{c.foodName}
												</p>
												<p className="text-muted-foreground text-xs">
													{c.quantity} {c.unit}
													{c.foodBrand ? ` · ${c.foodBrand}` : ""}
												</p>
											</div>
											<div className="text-right shrink-0">
												<span className="font-mono text-sm font-semibold text-white">
													{c.amount.toFixed(c.amount < 1 ? 2 : 1)}
												</span>
												<span className="text-muted-foreground ml-1 text-[10px] font-medium tracking-wider uppercase">
													{meta?.unit}
												</span>
												<p className="text-muted-foreground/60 text-right font-mono text-[10px]">
													{Math.round(pct)}%
												</p>
											</div>
										</div>
										<div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
											<div
												className={cn(
													"h-full rounded-full transition-all duration-500 ease-out",
													"bg-primary/70",
												)}
												style={{ width: `${barWidth}%` }}
											/>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
