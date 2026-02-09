"use client";

import { useOnboardingStore } from "~/app/_store/onboarding-store";
import { Ruler, Scale } from "lucide-react";

import { StepContainer } from "../step-container";

interface StepProps {
	onNext: () => void;
	onBack?: () => void;
	isLast?: boolean;
	isPending?: boolean;
}

export function UnitPreferences({ onNext, onBack, isLast, isPending }: StepProps) {
	const { unitSystem, updateFields } = useOnboardingStore();

	const options = [
		{
			value: "metric" as const,
			label: "Metric",
			detail: "kg, cm, kcal",
			icon: Scale,
		},
		{
			value: "imperial" as const,
			label: "Imperial",
			detail: "lbs, ft/in, kcal",
			icon: Ruler,
		},
	];

	return (
		<StepContainer
			title="Choose Your Units"
			description="Select your preferred measurement system. You can change this later."
			onNext={onNext}
			onBack={onBack}
			isLast={isLast}
			isPending={isPending}
		>
			<div className="grid grid-cols-2 gap-4">
				{options.map((opt) => {
					const Icon = opt.icon;
					const isSelected = unitSystem === opt.value;
					return (
						<button
							key={opt.value}
							type="button"
							onClick={() => updateFields({ unitSystem: opt.value })}
							className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
								isSelected
									? "border-primary bg-primary/10 text-primary"
									: "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
							}`}
						>
							<Icon className="h-8 w-8" />
							<span className="text-lg font-semibold">{opt.label}</span>
							<span className="text-muted-foreground text-sm">
								{opt.detail}
							</span>
						</button>
					);
				})}
			</div>
		</StepContainer>
	);
}
