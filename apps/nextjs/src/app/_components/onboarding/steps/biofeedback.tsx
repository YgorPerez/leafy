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

export function Biofeedback({ onNext, onBack, isLast, isPending }: StepProps) {
	const store = useOnboardingStore();
	const showMenstrual = store.sex === "female";

	return (
		<StepContainer
			title="Biofeedback"
			description="These factors affect water retention and metabolic rate, helping us interpret scale fluctuations."
			onNext={onNext}
			onBack={onBack}
			isLast={isLast}
			isPending={isPending}
		>
			{showMenstrual && (
				<div className="space-y-2">
					<Label>Track menstrual cycle fluctuations?</Label>
					<div className="grid grid-cols-2 gap-3">
						{[
							{ value: true, label: "Yes" },
							{ value: false, label: "No" },
						].map((opt) => (
							<button
								key={String(opt.value)}
								type="button"
								onClick={() =>
									store.updateFields({
										menstrualTracking: opt.value,
									})
								}
								className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${
									store.menstrualTracking === opt.value
										? "border-primary bg-primary/10 text-primary"
										: "border-white/10 bg-white/5 hover:border-white/20"
								}`}
							>
								{opt.label}
							</button>
						))}
					</div>
					<p className="text-muted-foreground text-xs">
						Accounts for cycle-related water retention and metabolic
						changes (up to 200-300 kcal/day).
					</p>
				</div>
			)}

			<div className="space-y-2">
				<Label>Average sleep quality</Label>
				<Select
					value={store.sleepQuality}
					onValueChange={(v) =>
						store.updateFields({
							sleepQuality: v as
								| "poor"
								| "fair"
								| "good"
								| "excellent",
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="poor">
							Poor (often &lt;6 hours, disrupted)
						</SelectItem>
						<SelectItem value="fair">
							Fair (6-7 hours, sometimes disrupted)
						</SelectItem>
						<SelectItem value="good">
							Good (7-8 hours, restful)
						</SelectItem>
						<SelectItem value="excellent">
							Excellent (8+ hours, consistent)
						</SelectItem>
					</SelectContent>
				</Select>
				<p className="text-muted-foreground text-xs">
					Poor sleep can suppress BMR and increase water retention via
					cortisol.
				</p>
			</div>
		</StepContainer>
	);
}
