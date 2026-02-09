"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "~/lib/utils";

const Slider = React.forwardRef<
	React.ElementRef<typeof SliderPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
		recommendedMin?: number;
		recommendedMax?: number;
	}
>(({ className, recommendedMin, recommendedMax, min, max, ...props }, ref) => {
	const trackMin = min ?? 0;
	const trackMax = max ?? 100;
	const range = trackMax - trackMin;

	const recLeft =
		recommendedMin != null ? ((recommendedMin - trackMin) / range) * 100 : undefined;
	const recRight =
		recommendedMax != null ? ((recommendedMax - trackMin) / range) * 100 : undefined;

	return (
		<SliderPrimitive.Root
			ref={ref}
			min={min}
			max={max}
			className={cn(
				"relative flex w-full touch-none select-none items-center",
				className,
			)}
			{...props}
		>
			<SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-white/10">
				{recLeft != null && recRight != null && (
					<div
						className="absolute h-full bg-green-500/25"
						style={{
							left: `${recLeft}%`,
							width: `${recRight - recLeft}%`,
						}}
					/>
				)}
				<SliderPrimitive.Range className="absolute h-full bg-primary" />
			</SliderPrimitive.Track>
			<SliderPrimitive.Thumb className="border-primary bg-background ring-offset-background focus-visible:ring-ring block h-5 w-5 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
		</SliderPrimitive.Root>
	);
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
