"use client";

import { useOnboardingStore } from "~/app/_store/onboarding-store";
import { useMemo } from "react";

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

function cmToFeetInches(cm: number) {
	const totalInches = cm / 2.54;
	const feet = Math.floor(totalInches / 12);
	const inches = Math.round(totalInches % 12);
	return { feet, inches };
}

function feetInchesToCm(feet: number, inches: number) {
	return Math.round((feet * 12 + inches) * 2.54);
}

function kgToLbs(kg: number) {
	return Math.round(kg * 2.205 * 10) / 10;
}

function lbsToKg(lbs: number) {
	return Math.round((lbs / 2.205) * 10) / 10;
}

export function Physical({ onNext, onBack, isLast, isPending }: StepProps) {
	const store = useOnboardingStore();
	const isImperial = store.unitSystem === "imperial";

	const heightDisplay = useMemo(() => {
		if (isImperial) return cmToFeetInches(store.heightCm);
		return { cm: store.heightCm };
	}, [store.heightCm, isImperial]);

	const weightDisplay = isImperial
		? kgToLbs(store.weightKg)
		: store.weightKg;

	const canProceed = store.birthDate && store.heightCm > 0 && store.weightKg > 0;

	return (
		<StepContainer
			title="About You"
			description="Your physical characteristics help us calculate accurate metabolic targets."
			onNext={onNext}
			onBack={onBack}
			isLast={isLast}
			isPending={isPending}
			nextDisabled={!canProceed}
		>
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label>Biological Sex</Label>
					<Select
						value={store.sex}
						onValueChange={(v) =>
							store.updateFields({ sex: v as "male" | "female" })
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="male">Male</SelectItem>
							<SelectItem value="female">Female</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label>Date of Birth</Label>
					<Input
						type="date"
						value={store.birthDate}
						onChange={(e) =>
							store.updateFields({ birthDate: e.target.value })
						}
					/>
				</div>
			</div>

			{isImperial ? (
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>Height (ft)</Label>
						<Input
							type="number"
							min={3}
							max={8}
							value={(heightDisplay as { feet: number; inches: number }).feet}
							onChange={(e) => {
								const ft = parseInt(e.target.value) || 0;
								const inches = (heightDisplay as { feet: number; inches: number }).inches;
								store.updateFields({
									heightCm: feetInchesToCm(ft, inches),
								});
							}}
						/>
					</div>
					<div className="space-y-2">
						<Label>Height (in)</Label>
						<Input
							type="number"
							min={0}
							max={11}
							value={(heightDisplay as { feet: number; inches: number }).inches}
							onChange={(e) => {
								const inches = parseInt(e.target.value) || 0;
								const ft = (heightDisplay as { feet: number; inches: number }).feet;
								store.updateFields({
									heightCm: feetInchesToCm(ft, inches),
								});
							}}
						/>
					</div>
				</div>
			) : (
				<div className="space-y-2">
					<Label>Height (cm)</Label>
					<Input
						type="number"
						step="1"
						placeholder="170"
						value={store.heightCm}
						onChange={(e) =>
							store.updateFields({
								heightCm: parseInt(e.target.value) || 0,
							})
						}
					/>
				</div>
			)}

			<div className="space-y-2">
				<Label>Current Weight ({isImperial ? "lbs" : "kg"})</Label>
				<Input
					type="number"
					step="0.1"
					placeholder={isImperial ? "154" : "70"}
					value={weightDisplay}
					onChange={(e) => {
						const val = parseFloat(e.target.value) || 0;
						store.updateFields({
							weightKg: isImperial ? lbsToKg(val) : val,
						});
					}}
				/>
			</div>

			<div className="space-y-2">
				<Label>
					Body Fat % <span className="text-muted-foreground">(optional)</span>
				</Label>
				<Input
					type="number"
					step="0.1"
					min={1}
					max={70}
					placeholder="e.g., 20"
					value={store.bodyFatPercent ?? ""}
					onChange={(e) => {
						const val = e.target.value
							? parseFloat(e.target.value)
							: null;
						store.updateFields({ bodyFatPercent: val });
					}}
				/>
				<p className="text-muted-foreground text-xs">
					If provided, we use a more accurate formula (Katch-McArdle) for
					your metabolism.
				</p>
			</div>
		</StepContainer>
	);
}
