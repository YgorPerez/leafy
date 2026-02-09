"use client";

import { useOnboardingStore } from "~/app/_store/onboarding-store";

import { Input } from "~/components/ui/input";
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

function kgToLbs(kg: number) {
	return Math.round(kg * 2.205 * 10) / 10;
}

function lbsToKg(lbs: number) {
	return Math.round((lbs / 2.205) * 10) / 10;
}

export function MetabolismSeeding({ onNext, onBack, isLast, isPending }: StepProps) {
	const store = useOnboardingStore();
	const isImperial = store.unitSystem === "imperial";

	const highestDisplay =
		store.highestWeightKg != null
			? isImperial
				? kgToLbs(store.highestWeightKg)
				: store.highestWeightKg
			: "";

	return (
		<StepContainer
			title="Metabolism Baseline"
			description="Help us seed your metabolism estimate more accurately."
			onNext={onNext}
			onBack={onBack}
			isLast={isLast}
			isPending={isPending}
		>
			<div className="space-y-2">
				<Label>How well do you know your recent calorie intake?</Label>
				<Select
					value={store.intakeKnowledge}
					onValueChange={(v) =>
						store.updateFields({
							intakeKnowledge: v as "none" | "rough" | "precise",
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">
							No idea what I&apos;ve been eating
						</SelectItem>
						<SelectItem value="rough">
							Rough estimate of my intake
						</SelectItem>
						<SelectItem value="precise">
							I track precisely already
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label>How has your weight been trending recently?</Label>
				<Select
					value={store.weightTrend}
					onValueChange={(v) =>
						store.updateFields({
							weightTrend: v as "losing" | "stable" | "gaining",
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="losing">Losing weight</SelectItem>
						<SelectItem value="stable">Stable</SelectItem>
						<SelectItem value="gaining">Gaining weight</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label>
					Highest Ever Adult Weight ({isImperial ? "lbs" : "kg"})
				</Label>
				<Input
					type="number"
					step="0.1"
					placeholder={
						isImperial
							? kgToLbs(store.weightKg).toString()
							: store.weightKg.toString()
					}
					value={highestDisplay}
					onChange={(e) => {
						const val = e.target.value
							? parseFloat(e.target.value)
							: null;
						store.updateFields({
							highestWeightKg:
								val != null
									? isImperial
										? lbsToKg(val)
										: val
									: null,
						});
					}}
				/>
				<p className="text-muted-foreground text-xs">
					Defaults to your current weight. If significantly higher, we
					account for metabolic adaptation (-3%).
				</p>
			</div>
		</StepContainer>
	);
}
