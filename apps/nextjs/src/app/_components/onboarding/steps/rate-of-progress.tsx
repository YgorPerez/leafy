"use client";

import { calculateOnboardingTDEE } from "@acme/api/client";
import { useOnboardingStore } from "~/app/_store/onboarding-store";
import { useMemo } from "react";

import { Slider } from "~/components/ui/slider";

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

export function RateOfProgress({ onNext, onBack, isLast, isPending }: StepProps) {
	const store = useOnboardingStore();

	const preview = useMemo(() => {
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

	const rateLabel =
		store.rateOfChange <= 0.3
			? "Conservative"
			: store.rateOfChange <= 0.5
				? "Recommended"
				: store.rateOfChange <= 0.75
					? "Moderate"
					: "Aggressive";

	const rateColor =
		store.rateOfChange <= 0.3
			? "text-green-400"
			: store.rateOfChange <= 0.5
				? "text-green-400"
				: store.rateOfChange <= 0.75
					? "text-yellow-400"
					: "text-red-400";

	return (
		<StepContainer
			title="Rate of Progress"
			description="How fast do you want to reach your goal? Slower rates are more sustainable."
			onNext={onNext}
			onBack={onBack}
			isLast={isLast}
			isPending={isPending}
		>
			<div className="space-y-6">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">
							{store.rateOfChange.toFixed(1)}% body weight / week
						</span>
						<span className={`text-sm font-semibold ${rateColor}`}>
							{rateLabel}
						</span>
					</div>
					<Slider
						value={[store.rateOfChange * 100]}
						onValueChange={(v) =>
							store.updateFields({ rateOfChange: v[0]! / 100 })
						}
						min={20}
						max={100}
						step={5}
						recommendedMin={20}
						recommendedMax={50}
					/>
					<div className="text-muted-foreground flex justify-between text-xs">
						<span>0.2%</span>
						<span>0.5%</span>
						<span>1.0%</span>
					</div>
				</div>

				{preview && (
					<div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
						<h3 className="text-sm font-semibold">Preview</h3>
						<div className="grid grid-cols-2 gap-3 text-sm">
							<div>
								<p className="text-muted-foreground">Daily Calories</p>
								<p className="text-lg font-bold">
									{preview.dailyCalorieTarget.toLocaleString()} kcal
								</p>
							</div>
							<div>
								<p className="text-muted-foreground">Weekly Change</p>
								<p className="text-lg font-bold">
									{preview.weeklyDeficitSurplus > 0 ? "+" : ""}
									{preview.weeklyDeficitSurplus.toLocaleString()} kcal
								</p>
							</div>
							{store.goalType !== "maintain" && (
								<>
									<div>
										<p className="text-muted-foreground">Estimated Weeks</p>
										<p className="text-lg font-bold">
											{preview.estimatedWeeksToGoal}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">Goal Date</p>
										<p className="text-lg font-bold">
											{new Date(
												preview.estimatedGoalDate,
											).toLocaleDateString(undefined, {
												month: "short",
												year: "numeric",
											})}
										</p>
									</div>
								</>
							)}
						</div>
					</div>
				)}
			</div>
		</StepContainer>
	);
}
