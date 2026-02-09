"use client";

import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

interface StepContainerProps {
	title: string;
	description: string;
	children: React.ReactNode;
	onNext: () => void;
	onBack?: () => void;
	isLast?: boolean;
	nextLabel?: string;
	nextDisabled?: boolean;
	isPending?: boolean;
}

export function StepContainer({
	title,
	description,
	children,
	onNext,
	onBack,
	isLast,
	nextLabel,
	nextDisabled,
	isPending,
}: StepContainerProps) {
	return (
		<Card className="w-full max-w-lg border-white/10 bg-black/50 backdrop-blur-xl">
			<CardHeader>
				<CardTitle className="text-xl">{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">{children}</CardContent>
			<CardFooter className="flex justify-between gap-4">
				{onBack ? (
					<Button variant="ghost" onClick={onBack} disabled={isPending}>
						Back
					</Button>
				) : (
					<div />
				)}
				<Button onClick={onNext} disabled={nextDisabled || isPending}>
					{isPending
						? "Saving..."
						: nextLabel ?? (isLast ? "Complete Setup" : "Continue")}
				</Button>
			</CardFooter>
		</Card>
	);
}
