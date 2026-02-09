"use client";

import { format } from "date-fns";
import { Droplets, Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/react";

const WATER_TARGET_ML = 2500;

export function HydrationWidget({ date }: { date: Date }) {
	const formattedDate = format(date, "yyyy-MM-dd");
	const utils = api.useUtils();

	const { data } = api.food.getWaterIntake.useQuery({
		date: formattedDate,
	});

	const logWater = api.food.logWater.useMutation({
		onSuccess: () => {
			void utils.food.getWaterIntake.invalidate({ date: formattedDate });
			void utils.food.getDailyNutrition.invalidate({ date: formattedDate });
			void utils.food.getDailyLogs.invalidate();
		},
	});

	const totalMl = data?.total_ml ?? 0;
	const progress = Math.min(totalMl / WATER_TARGET_ML, 1);
	const glasses = Math.round(totalMl / 250);

	const handleAdd = (amount: number) => {
		logWater.mutate({ date: formattedDate, amount_ml: amount });
	};

	// SVG circle for progress ring
	const radius = 36;
	const circumference = 2 * Math.PI * radius;
	const strokeOffset = circumference * (1 - progress);

	return (
		<Card className="overflow-hidden border-white/5 bg-white/[0.02] backdrop-blur-md">
			<CardContent className="p-5">
				<div className="mb-3 flex items-center justify-between">
					<h3 className="text-sm font-bold tracking-wide text-white/60 uppercase">
						Hydration
					</h3>
					<span className="text-xs text-white/40">{glasses} glasses</span>
				</div>

				<div className="flex items-center gap-4">
					<div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center">
						<svg className="h-20 w-20 -rotate-90 transform">
							<circle
								cx="40"
								cy="40"
								r={radius}
								fill="transparent"
								stroke="currentColor"
								strokeWidth="5"
								className="text-white/5"
							/>
							<circle
								cx="40"
								cy="40"
								r={radius}
								fill="transparent"
								stroke="currentColor"
								strokeWidth="5"
								strokeDasharray={circumference}
								strokeDashoffset={strokeOffset}
								strokeLinecap="round"
								className="text-blue-400 transition-all duration-700 ease-out"
							/>
						</svg>
						<Droplets className="absolute h-5 w-5 text-blue-400" />
					</div>

					<div className="flex flex-1 flex-col gap-2">
						<div>
							<span className="text-2xl font-black tracking-tight text-white">
								{totalMl >= 1000
									? `${(totalMl / 1000).toFixed(1)}L`
									: `${totalMl}ml`}
							</span>
							<span className="ml-1 text-sm text-white/40">
								/ {WATER_TARGET_ML / 1000}L
							</span>
						</div>

						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								className="h-7 border-white/10 bg-white/5 text-xs hover:bg-blue-500/20"
								onClick={() => handleAdd(250)}
								disabled={logWater.isPending}
							>
								<Plus className="mr-1 h-3 w-3" />
								250ml
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-7 border-white/10 bg-white/5 text-xs hover:bg-blue-500/20"
								onClick={() => handleAdd(500)}
								disabled={logWater.isPending}
							>
								<Plus className="mr-1 h-3 w-3" />
								500ml
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
