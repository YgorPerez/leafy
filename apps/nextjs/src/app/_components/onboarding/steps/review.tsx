"use client";

import { calculateOnboardingTDEE } from "@acme/api/client";
import { useOnboardingStore } from "~/app/_store/onboarding-store";
import { useMemo } from "react";

import { StepContainer } from "../step-container";

interface StepProps {
	onNext: () => void;
	onBack?: () => void;
	isLast?: boolean;
	isPending?: boolean;
}

function getAge(birthDate: string): number {
	const birth = new Date(birthDate);
	const now = new Date();
	let age = now.getFullYear() - birth.getFullYear();
	const m = now.getMonth() - birth.getMonth();
	if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
	return age;
}

function kgToLbs(kg: number) {
	return Math.round(kg * 2.205 * 10) / 10;
}

function formatWeight(kg: number, imperial: boolean) {
	return imperial ? `${kgToLbs(kg)} lbs` : `${kg} kg`;
}

export function Review({ onNext, onBack, isLast, isPending }: StepProps) {
	const store = useOnboardingStore();
	const isImperial = store.unitSystem === "imperial";

	const result = useMemo(() => {
		if (!store.goalType || !store.birthDate) return null;
		return calculateOnboardingTDEE({
			sex: store.sex,
			age: getAge(store.birthDate),
			weightKg: store.weightKg,
			heightCm: store.heightCm,
			bodyFatPercent: store.bodyFatPercent,
			activityLevel: store.activityLevel,
			goalType: store.goalType,
			highestWeightKg: store.highestWeightKg ?? store.weightKg,
			rateOfChange: store.rateOfChange,
			targetWeightKg: store.targetWeightKg ?? store.weightKg,
		});
	}, [
		store.sex,
		store.birthDate,
		store.weightKg,
		store.heightCm,
		store.bodyFatPercent,
		store.activityLevel,
		store.goalType,
		store.highestWeightKg,
		store.rateOfChange,
		store.targetWeightKg,
	]);

	const sections = [
		{
			title: "Profile",
			items: [
				{ label: "Sex", value: store.sex === "male" ? "Male" : "Female" },
				{
					label: "Age",
					value: store.birthDate ? `${getAge(store.birthDate)} years` : "—",
				},
				{
					label: "Weight",
					value: formatWeight(store.weightKg, isImperial),
				},
				{
					label: "Height",
					value: isImperial
						? `${Math.floor(store.heightCm / 2.54 / 12)}′${Math.round((store.heightCm / 2.54) % 12)}″`
						: `${store.heightCm} cm`,
				},
			],
		},
		{
			title: "Goal",
			items: [
				{
					label: "Type",
					value:
						store.goalType === "lose"
							? "Lose Weight"
							: store.goalType === "gain"
								? "Gain Weight"
								: "Maintain",
				},
				...(store.goalType !== "maintain"
					? [
							{
								label: "Target",
								value: formatWeight(
									store.targetWeightKg ?? store.weightKg,
									isImperial,
								),
							},
							{
								label: "Rate",
								value: `${store.rateOfChange.toFixed(1)}% BW/week`,
							},
						]
					: []),
			],
		},
		{
			title: "Activity",
			items: [
				{
					label: "Daily Movement",
					value:
						store.activityLevel === "sedentary"
							? "Sedentary"
							: store.activityLevel === "low"
								? "Lightly Active"
								: store.activityLevel === "active"
									? "Moderately Active"
									: "Very Active",
				},
				{
					label: "Exercise",
					value: `${store.exerciseFrequency} days/week`,
				},
			],
		},
		{
			title: "Diet",
			items: [
				{
					label: "Type",
					value: store.dietType.charAt(0).toUpperCase() + store.dietType.slice(1),
				},
				{
					label: "Macros",
					value: `C${store.macroDistribution.carbPercent}/P${store.macroDistribution.proteinPercent}/F${store.macroDistribution.fatPercent}`,
				},
			],
		},
	];

	return (
		<StepContainer
			title="Review Your Plan"
			description="Here's a summary of your setup. Hit Complete to get started!"
			onNext={onNext}
			onBack={onBack}
			isLast={isLast}
			isPending={isPending}
		>
			{/* Computed results */}
			{result && (
				<div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
					<h3 className="text-sm font-semibold text-primary">
						Your Computed Targets
					</h3>
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<p className="text-muted-foreground">BMR</p>
							<p className="text-lg font-bold">
								{result.bmr.toLocaleString()} kcal
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">TDEE</p>
							<p className="text-lg font-bold">
								{result.tdee.toLocaleString()} kcal
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">Daily Target</p>
							<p className="text-xl font-bold text-primary">
								{result.dailyCalorieTarget.toLocaleString()} kcal
							</p>
						</div>
						{store.goalType !== "maintain" && (
							<div>
								<p className="text-muted-foreground">Goal Date</p>
								<p className="text-lg font-bold">
									{new Date(
										result.estimatedGoalDate,
									).toLocaleDateString(undefined, {
										month: "short",
										year: "numeric",
									})}
								</p>
							</div>
						)}
					</div>
					{result.bmrFormula === "katch_mcardle" && (
						<p className="text-xs text-muted-foreground">
							Using Katch-McArdle formula (body fat % provided)
						</p>
					)}
				</div>
			)}

			{/* Summary sections */}
			<div className="space-y-3">
				{sections.map((section) => (
					<div
						key={section.title}
						className="rounded-xl border border-white/10 bg-white/5 p-3"
					>
						<h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							{section.title}
						</h4>
						<div className="space-y-1">
							{section.items.map((item) => (
								<div
									key={item.label}
									className="flex justify-between text-sm"
								>
									<span className="text-muted-foreground">
										{item.label}
									</span>
									<span className="font-medium">{item.value}</span>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</StepContainer>
	);
}
