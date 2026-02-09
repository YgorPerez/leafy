"use client";

import { useOnboardingStore } from "~/app/_store/onboarding-store";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

import { StepContainer } from "../step-container";

interface StepProps {
	onNext: () => void;
	onBack?: () => void;
	isLast?: boolean;
	isPending?: boolean;
}

function kgToLbs(kg: number) {
	return Math.round(kg * 2.205 * 10) / 10;
}

function lbsToKg(lbs: number) {
	return Math.round((lbs / 2.205) * 10) / 10;
}

const GOALS = [
	{
		value: "lose" as const,
		label: "Lose Weight",
		description: "Focus on caloric deficit",
		icon: ArrowDown,
		color: "text-blue-400",
	},
	{
		value: "maintain" as const,
		label: "Maintain",
		description: "Focus on energy balance",
		icon: ArrowRight,
		color: "text-green-400",
	},
	{
		value: "gain" as const,
		label: "Gain Weight",
		description: "Focus on caloric surplus",
		icon: ArrowUp,
		color: "text-orange-400",
	},
];

export function GoalSetting({ onNext, onBack, isLast, isPending }: StepProps) {
	const store = useOnboardingStore();
	const isImperial = store.unitSystem === "imperial";

	const targetDisplay =
		store.targetWeightKg != null
			? isImperial
				? kgToLbs(store.targetWeightKg)
				: store.targetWeightKg
			: "";

	const canProceed = store.goalType != null;

	return (
		<StepContainer
			title="What's Your Goal?"
			description="Choose what you'd like to achieve. We'll adjust your targets accordingly."
			onNext={onNext}
			onBack={onBack}
			isLast={isLast}
			isPending={isPending}
			nextDisabled={!canProceed}
		>
			<div className="grid grid-cols-3 gap-3">
				{GOALS.map((goal) => {
					const Icon = goal.icon;
					const isSelected = store.goalType === goal.value;
					return (
						<button
							key={goal.value}
							type="button"
							onClick={() => {
								store.updateFields({ goalType: goal.value });
								// Set sensible default target weight
								if (goal.value === "maintain") {
									store.updateFields({
										targetWeightKg: store.weightKg,
									});
								} else if (
									goal.value === "lose" &&
									store.targetWeightKg == null
								) {
									store.updateFields({
										targetWeightKg: Math.round(store.weightKg * 0.9),
									});
								} else if (
									goal.value === "gain" &&
									store.targetWeightKg == null
								) {
									store.updateFields({
										targetWeightKg: Math.round(store.weightKg * 1.1),
									});
								}
							}}
							className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
								isSelected
									? "border-primary bg-primary/10"
									: "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
							}`}
						>
							<Icon className={`h-6 w-6 ${isSelected ? goal.color : ""}`} />
							<span className="text-sm font-semibold">{goal.label}</span>
							<span className="text-muted-foreground text-xs">
								{goal.description}
							</span>
						</button>
					);
				})}
			</div>

			{store.goalType && store.goalType !== "maintain" && (
				<div className="space-y-2">
					<Label>
						Target Weight ({isImperial ? "lbs" : "kg"})
					</Label>
					<Input
						type="number"
						step="0.1"
						value={targetDisplay}
						onChange={(e) => {
							const val = parseFloat(e.target.value) || 0;
							store.updateFields({
								targetWeightKg: isImperial ? lbsToKg(val) : val,
							});
						}}
					/>
				</div>
			)}
		</StepContainer>
	);
}
