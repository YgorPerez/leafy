"use client";

import { useOnboardingStore } from "~/app/_store/onboarding-store";

import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";

import { StepContainer } from "../step-container";

interface StepProps {
	onNext: () => void;
	onBack?: () => void;
	isLast?: boolean;
	isPending?: boolean;
}

const SHIFT_TYPES = [
	{
		value: "uniform" as const,
		label: "Uniform",
		description: "Same calories every day",
	},
	{
		value: "manual" as const,
		label: "Manual Shifting",
		description: "Choose specific high/low days",
	},
	{
		value: "training_based" as const,
		label: "Training-Based",
		description: "Higher calories on training days",
	},
];

const DAYS = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
] as const;

const CHECK_IN_DAYS = DAYS.map((d) => ({
	value: d,
	label: d.charAt(0).toUpperCase() + d.slice(1),
}));

export function CalorieShifting({ onNext, onBack, isLast, isPending }: StepProps) {
	const store = useOnboardingStore();

	const handleDayToggle = (
		day: string,
		level: "high" | "low" | "normal",
	) => {
		const newConfig = { ...store.dayConfig };
		if (newConfig[day] === level) {
			delete newConfig[day];
		} else {
			newConfig[day] = level;
		}
		store.updateFields({ dayConfig: newConfig });
	};

	return (
		<StepContainer
			title="Calorie Schedule"
			description="Distribute your weekly calorie budget across the week for sustainability."
			onNext={onNext}
			onBack={onBack}
			isLast={isLast}
			isPending={isPending}
		>
			<div className="space-y-2">
				<Label>Calorie Distribution</Label>
				<div className="grid grid-cols-3 gap-3">
					{SHIFT_TYPES.map((type) => {
						const isSelected =
							store.calorieShiftType === type.value;
						return (
							<button
								key={type.value}
								type="button"
								onClick={() =>
									store.updateFields({
										calorieShiftType: type.value,
									})
								}
								className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all ${
									isSelected
										? "border-primary bg-primary/10 text-primary"
										: "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
								}`}
							>
								<span className="text-sm font-semibold">
									{type.label}
								</span>
								<span className="text-muted-foreground text-center text-xs">
									{type.description}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{store.calorieShiftType === "manual" && (
				<div className="space-y-2">
					<Label>Day Configuration</Label>
					<div className="grid grid-cols-7 gap-1">
						{DAYS.map((day) => {
							const level = store.dayConfig[day] ?? "normal";
							return (
								<div key={day} className="flex flex-col items-center gap-1">
									<span className="text-xs text-muted-foreground">
										{day.slice(0, 2).toUpperCase()}
									</span>
									<button
										type="button"
										onClick={() =>
											handleDayToggle(
												day,
												level === "normal"
													? "high"
													: level === "high"
														? "low"
														: "normal",
											)
										}
										className={`rounded-lg border px-2 py-1 text-xs font-medium transition-all ${
											level === "high"
												? "border-green-500/50 bg-green-500/20 text-green-400"
												: level === "low"
													? "border-blue-500/50 bg-blue-500/20 text-blue-400"
													: "border-white/10 bg-white/5"
										}`}
									>
										{level === "high"
											? "H"
											: level === "low"
												? "L"
												: "N"}
									</button>
								</div>
							);
						})}
					</div>
					<p className="text-muted-foreground text-xs">
						Click to cycle: Normal → High → Low. Weekly total stays
						the same.
					</p>
				</div>
			)}

			<div className="space-y-2">
				<Label>Weekly Check-in Day</Label>
				<Select
					value={store.checkInDay}
					onValueChange={(v) =>
						store.updateFields({
							checkInDay: v as (typeof DAYS)[number],
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{CHECK_IN_DAYS.map((d) => (
							<SelectItem key={d.value} value={d.value}>
								{d.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<p className="text-muted-foreground text-xs">
					The day you review progress and receive program updates.
				</p>
			</div>
		</StepContainer>
	);
}
