"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	rectSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Check, Pencil } from "lucide-react";
import { useCallback, useState } from "react";

import { useUser } from "~/app/_context/user-context";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { SortableWidget } from "./sortable-widget";
import { WidgetGallery } from "./widget-gallery";
import { DEFAULT_WIDGETS, WIDGET_REGISTRY } from "./widget-registry";

interface WidgetGridProps {
	date: Date;
}

export function WidgetGrid({ date }: WidgetGridProps) {
	const { dashboardConfig } = useUser();
	const [isEditMode, setIsEditMode] = useState(false);
	const [galleryOpen, setGalleryOpen] = useState(false);

	// Use config from DB or defaults
	const initialWidgets = dashboardConfig?.widgets ?? DEFAULT_WIDGETS;
	const [widgets, setWidgets] = useState(initialWidgets);

	const updateConfig = api.food.updateDashboardConfig.useMutation();

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const saveConfig = useCallback(
		(newWidgets: typeof widgets) => {
			const sorted = newWidgets.map((w, i) => ({ ...w, order: i }));
			setWidgets(sorted);
			updateConfig.mutate({ widgets: sorted });
		},
		[updateConfig],
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			const oldIndex = widgets.findIndex((w) => w.id === active.id);
			const newIndex = widgets.findIndex((w) => w.id === over.id);
			const newWidgets = arrayMove(widgets, oldIndex, newIndex);
			saveConfig(newWidgets);
		}
	};

	const handleRemove = (id: string) => {
		const newWidgets = widgets.filter((w) => w.id !== id);
		saveConfig(newWidgets);
	};

	const handleAdd = (id: string) => {
		const newWidgets = [...widgets, { id, order: widgets.length }];
		saveConfig(newWidgets);
	};

	const activeWidgetIds = widgets.map((w) => w.id);

	return (
		<div className="w-full">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-foreground text-lg font-semibold">Dashboard</h2>
				<div className="flex items-center gap-2">
					{isEditMode && (
						<WidgetGallery
							activeWidgetIds={activeWidgetIds}
							onAdd={handleAdd}
							open={galleryOpen}
							onOpenChange={setGalleryOpen}
						/>
					)}
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={() => setIsEditMode(!isEditMode)}
					>
						{isEditMode ? (
							<Check className="h-4 w-4 text-green-500" />
						) : (
							<Pencil className="text-muted-foreground h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={widgets.map((w) => w.id)}
					strategy={rectSortingStrategy}
				>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{widgets.map((widget) => {
							const definition = WIDGET_REGISTRY[widget.id];
							if (!definition) return null;

							const WidgetComponent = definition.component;
							return (
								<SortableWidget
									key={widget.id}
									id={widget.id}
									isEditMode={isEditMode}
									onRemove={handleRemove}
								>
									<WidgetComponent date={date} />
								</SortableWidget>
							);
						})}
					</div>
				</SortableContext>
			</DndContext>

			{widgets.length === 0 && (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 py-12">
					<p className="text-muted-foreground mb-4 text-sm">
						No widgets configured
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setIsEditMode(true);
							setGalleryOpen(true);
						}}
					>
						Add your first widget
					</Button>
				</div>
			)}
		</div>
	);
}
