"use client";

import { useOnboardingStore } from "~/app/_store/onboarding-store";

import { Label } from "~/components/ui/label";

import { StepContainer } from "../step-container";

interface StepProps {
	onNext: () => void;
	onBack?: () => void;
	isLast?: boolean;
	isPending?: boolean;
}

const EXPERIENCE_LEVELS = [
	{
		value: "beginner" as const,
		label: "Beginner",
		description: "Less than 1 year of consistent training",
	},
	{
		value: "intermediate" as const,
		label: "Intermediate",
		description: "1-3 years of consistent training",
	},
	{
		value: "advanced" as const,
		label: "Advanced",
		description: "3+ years of consistent training",
	},
];

export function Training({ onNext, onBack, isLast, isPending }: StepProps) {
	const store = useOnboardingStore();

	return (
		<StepContainer
			title="Training Experience"
			description="Your training background helps us set better expectations for progress."
			onNext={onNext}
			onBack={onBack}
			isLast={isLast}
			isPending={isPending}
		>
			<div className="space-y-2">
				<Label>Training Experience</Label>
				<div className="grid grid-cols-3 gap-3">
					{EXPERIENCE_LEVELS.map((level) => {
						const isSelected =
							store.trainingExperience === level.value;
						return (
							<button
								key={level.value}
								type="button"
								onClick={() =>
									store.updateFields({
										trainingExperience: level.value,
									})
								}
								className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all ${
									isSelected
										? "border-primary bg-primary/10 text-primary"
										: "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
								}`}
							>
								<span className="text-sm font-semibold">
									{level.label}
								</span>
								<span className="text-muted-foreground text-xs text-center">
									{level.description}
								</span>
							</button>
						);
					})}
				</div>
			</div>
		</StepContainer>
	);
}
