"use client";

import { getIntake } from "@acme/api/client";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { LogDetailsDialog } from "./log-details-dialog";

interface LogEntry {
	id: string;
	foodName: string;
	foodBrand: string | null;
	quantity: number;
	unit: string;
	nutrients: Record<string, number> | null;
}

export function LoggedFoods({ date }: { date: Date }) {
	const formattedDate = format(date, "yyyy-MM-dd");
	const utils = api.useUtils();
	const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

	const { data: logs, isLoading } = api.food.getDailyLogs.useQuery({
		date: formattedDate,
	});

	const deleteLogMutation = api.food.deleteLog.useMutation({
		onSuccess: () => {
			toast.success("Entry deleted");
			void utils.food.getDailyLogs.invalidate();
			void utils.food.getDailyNutrition.invalidate();
		},
	});

	if (isLoading) {
		return (
			<Card className="border-primary/20 bg-primary/5 w-full max-w-4xl">
				<CardHeader>
					<CardTitle className="text-primary text-xl">Today's Diary</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className="bg-background/50 flex items-center justify-between rounded-lg border border-white/5 p-3 shadow-sm"
							>
								<div className="space-y-1">
									<Skeleton className="h-5 w-40" />
									<Skeleton className="h-3 w-24" />
								</div>
								<div className="flex items-center gap-4">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-8 w-8 rounded" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}
	if (!logs || logs.length === 0) return null;

	return (
		<>
			<Card className="border-primary/20 bg-primary/5 w-full max-w-4xl">
				<CardHeader>
					<CardTitle className="text-primary text-xl">Today's Diary</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{logs.map((log) => {
							const nutrients = log.nutrients as
								| Record<string, number>
								| undefined;
							const energy = getIntake(nutrients, "energy");

							return (
								<div
									key={log.id}
									className="bg-background/50 hover:bg-background/70 flex cursor-pointer items-center justify-between rounded-lg border border-white/5 p-3 shadow-sm transition-colors"
									onClick={() =>
										setSelectedLog({
											id: log.id,
											foodName: log.foodName,
											foodBrand: log.foodBrand,
											quantity: log.quantity,
											unit: log.unit,
											nutrients: nutrients ?? null,
										})
									}
								>
									<div>
										<div className="font-semibold">{log.foodName}</div>
										<div className="text-muted-foreground text-xs">
											{log.quantity} {log.unit} • {log.foodBrand || "Generic"}
										</div>
									</div>
									<div className="flex items-center gap-4">
										<div className="text-right text-sm">
											{energy > 0 && (
												<span className="font-bold">{energy} kcal</span>
											)}
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="text-destructive h-8 w-8 opacity-50 hover:opacity-100"
											onClick={(e) => {
												e.stopPropagation();
												deleteLogMutation.mutate({ id: log.id });
											}}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			<LogDetailsDialog
				log={selectedLog}
				isOpen={!!selectedLog}
				onClose={() => setSelectedLog(null)}
			/>
		</>
	);
}
