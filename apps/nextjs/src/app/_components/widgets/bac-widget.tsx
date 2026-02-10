"use client";

import { differenceInHours } from "date-fns";
import { format } from "date-fns";
import { AlertTriangle, Wine } from "lucide-react";

import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/react";

const IMPAIRMENT_COLORS: Record<string, string> = {
	none: "text-green-400",
	mild: "text-yellow-400",
	moderate: "text-orange-400",
	significant: "text-red-400",
	severe: "text-red-600",
	dangerous: "text-red-800",
};

export function BACWidget({ date }: { date: Date }) {
	const now = new Date();
	const startOfDay = new Date(date);
	startOfDay.setHours(0, 0, 0, 0);
	const hoursElapsed = Math.max(0, differenceInHours(now, startOfDay));

	const formattedDate = format(date, "yyyy-MM-dd");

	const { data: bacResult } = api.food.getBAC.useQuery(
		{ date: formattedDate, hoursElapsed },
		{ refetchInterval: 60_000 },
	);

	if (!bacResult) return null;

	const bacPercent = (bacResult.bac * 100).toFixed(2);
	const colorClass =
		IMPAIRMENT_COLORS[bacResult.impairmentLevel] ?? "text-white/60";

	return (
		<Card className="overflow-hidden border-white/5 bg-white/[0.02] backdrop-blur-md">
			<CardContent className="p-5">
				<div className="mb-3 flex items-center justify-between">
					<h3 className="flex items-center gap-2 text-sm font-bold tracking-wide text-white/60 uppercase">
						<Wine className="h-4 w-4" />
						Estimated BAC
					</h3>
					<span className="text-xs text-white/40">
						{bacResult.standardDrinks} drinks
					</span>
				</div>

				<div className="flex items-center gap-4">
					<div className="flex flex-col items-center">
						<span className={`text-3xl font-black ${colorClass}`}>
							{bacPercent}%
						</span>
						<span className="text-xs capitalize text-white/40">
							{bacResult.impairmentLevel}
						</span>
					</div>

					<div className="flex flex-1 flex-col gap-1 text-xs text-white/60">
						<div>~{bacResult.timeToSober}h until sober</div>
						<div className="flex items-center gap-1 text-[10px] text-white/30">
							<AlertTriangle className="h-3 w-3" />
							Estimate only
						</div>
					</div>
				</div>

				<p className="mt-3 text-[9px] leading-tight text-white/20">
					{bacResult.disclaimer}
				</p>
			</CardContent>
		</Card>
	);
}
