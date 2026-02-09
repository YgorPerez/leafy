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
import { Slider } from "~/components/ui/slider";

import { StepContainer } from "../step-container";

interface StepProps {
	onNext: () => void;
	onBack?: () => void;
	isLast?: boolean;
	isPending?: boolean;
}

const DIET_TYPES = [
	{ value: "standard", label: "Standard (Omnivore)" },
	{ value: "vegetarian", label: "Vegetarian" },
	{ value: "vegan", label: "Vegan" },
	{ value: "low_fat", label: "Low Fat" },
	{ value: "low_carb", label: "Low Carb" },
	{ value: "keto", label: "Keto" },
];

function computeProteinPercent(proteinGPerKg: number, weightKg: number, tdee: number) {
	if (tdee <= 0) return 25;
	const proteinKcal = proteinGPerKg * weightKg * 4;
	return Math.round((proteinKcal / tdee) * 100);
}

export function Dietary({ onNext, onBack, isLast, isPending }: StepProps) {
	const store = useOnboardingStore();
	const { macroDistribution } = store;
	const macroSum =
		macroDistribution.carbPercent +
		macroDistribution.proteinPercent +
		macroDistribution.fatPercent;

	// Rough TDEE estimate for protein % calculation
	const estimatedTdee = store.weightKg * 30; // ~30 kcal/kg rough estimate

	const handleProteinChange = (proteinGPerKg: number) => {
		const newProteinPct = computeProteinPercent(
			proteinGPerKg,
			store.weightKg,
			estimatedTdee,
		);
		const oldProteinPct = macroDistribution.proteinPercent;
		const diff = newProteinPct - oldProteinPct;

		// Distribute the difference proportionally between carbs and fat
		const carbShare = macroDistribution.carbPercent / (macroDistribution.carbPercent + macroDistribution.fatPercent || 1);
		const newCarbs = Math.max(5, Math.round(macroDistribution.carbPercent - diff * carbShare));
		const newFat = Math.max(5, 100 - newProteinPct - newCarbs);
		const adjustedCarbs = 100 - newProteinPct - newFat;

		store.updateFields({
			proteinTarget: proteinGPerKg,
			macroDistribution: {
				proteinPercent: newProteinPct,
				carbPercent: Math.max(5, adjustedCarbs),
				fatPercent: Math.max(5, newFat),
			},
		});
	};

	const handleMacroChange = (
		field: "carbPercent" | "proteinPercent" | "fatPercent",
		value: number,
	) => {
		store.updateFields({
			macroDistribution: {
				...macroDistribution,
				[field]: value,
			},
		});
	};

	const proteinLabel =
		store.proteinTarget < 0.8
			? "Below minimum"
			: store.proteinTarget <= 1.2
				? "Health minimum"
				: store.proteinTarget <= 1.8
					? "Recommended"
					: store.proteinTarget <= 2.4
						? "Optimal for muscle"
						: "Diminishing returns";

	const proteinColor =
		store.proteinTarget < 0.8
			? "text-red-400"
			: store.proteinTarget <= 1.2
				? "text-yellow-400"
				: store.proteinTarget <= 2.4
					? "text-green-400"
					: "text-yellow-400";

	return (
		<StepContainer
			title="Dietary Preferences"
			description="Configure your diet type and macro split."
			onNext={onNext}
			onBack={onBack}
			isLast={isLast}
			isPending={isPending}
		>
			<div className="space-y-2">
				<Label>Diet Type</Label>
				<Select
					value={store.dietType}
					onValueChange={(v) =>
						store.updateFields({
							dietType: v as typeof store.dietType,
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{DIET_TYPES.map((dt) => (
							<SelectItem key={dt.value} value={dt.value}>
								{dt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Label>Protein Target</Label>
					<span className="text-sm font-medium">
						{store.proteinTarget.toFixed(1)} g/kg
						<span className="text-muted-foreground ml-1">
							({Math.round(store.proteinTarget * store.weightKg)}g/day)
						</span>
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className={`text-xs font-semibold ${proteinColor}`}>
						{proteinLabel}
					</span>
				</div>
				<Slider
					value={[store.proteinTarget * 10]}
					onValueChange={(v) => handleProteinChange(v[0]! / 10)}
					min={4}
					max={35}
					step={1}
					recommendedMin={16}
					recommendedMax={24}
				/>
				<div className="text-muted-foreground flex justify-between text-xs">
					<span>0.4</span>
					<span className="text-yellow-400">0.8 min</span>
					<span className="text-green-400">1.6 rec</span>
					<span className="text-green-400">2.4 optimal</span>
					<span>3.5</span>
				</div>
				<div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 space-y-1">
					<p className="text-xs text-muted-foreground">
						<span className="text-yellow-400 font-medium">0.8 g/kg</span> — Minimum for general health (RDA)
					</p>
					<p className="text-xs text-muted-foreground">
						<span className="text-green-400 font-medium">1.6 g/kg</span> — Recommended for active individuals
					</p>
					<p className="text-xs text-muted-foreground">
						<span className="text-green-400 font-medium">1.6-2.4 g/kg</span> — Optimal range for muscle growth
					</p>
					<p className="text-xs text-muted-foreground">
						<span className="text-yellow-400 font-medium">&gt;2.4 g/kg</span> — Diminishing returns for most people
					</p>
				</div>
			</div>

			<div className="space-y-3">
				<Label>Macro Distribution</Label>
				<div className="grid grid-cols-3 gap-3">
					<div className="space-y-1">
						<label className="text-xs text-muted-foreground">
							Carbs %
						</label>
						<Input
							type="number"
							min={5}
							max={80}
							value={macroDistribution.carbPercent}
							onChange={(e) =>
								handleMacroChange(
									"carbPercent",
									parseInt(e.target.value) || 0,
								)
							}
						/>
					</div>
					<div className="space-y-1">
						<label className="text-xs text-muted-foreground">
							Protein %
						</label>
						<Input
							type="number"
							min={5}
							max={60}
							value={macroDistribution.proteinPercent}
							onChange={(e) =>
								handleMacroChange(
									"proteinPercent",
									parseInt(e.target.value) || 0,
								)
							}
						/>
					</div>
					<div className="space-y-1">
						<label className="text-xs text-muted-foreground">
							Fat %
						</label>
						<Input
							type="number"
							min={5}
							max={70}
							value={macroDistribution.fatPercent}
							onChange={(e) =>
								handleMacroChange(
									"fatPercent",
									parseInt(e.target.value) || 0,
								)
							}
						/>
					</div>
				</div>
				{macroSum !== 100 && (
					<p className="text-destructive text-xs">
						Total must equal 100% (currently {macroSum}%)
					</p>
				)}
			</div>
		</StepContainer>
	);
}
