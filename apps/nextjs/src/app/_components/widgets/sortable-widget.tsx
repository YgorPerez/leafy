"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";

import { Button } from "~/components/ui/button";

interface SortableWidgetProps {
  id: string;
  children: ReactNode;
  isEditMode: boolean;
  onRemove: (id: string) => void;
}

export function SortableWidget({
  id,
  children,
  isEditMode,
  onRemove,
}: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative" {...attributes}>
      {isEditMode && (
        <>
          <button
            {...listeners}
            className="absolute top-1/2 -left-2 z-10 flex h-8 w-6 -translate-y-1/2 cursor-grab items-center justify-center rounded-l-md bg-white/10 text-white/40 hover:bg-white/20 hover:text-white/60 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full bg-red-500/80 text-white hover:bg-red-600"
            onClick={() => onRemove(id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </>
      )}
      <div
        className={
          isEditMode
            ? "rounded-lg ring-2 ring-white/10 ring-offset-2 ring-offset-transparent"
            : ""
        }
      >
        {children}
      </div>
    </div>
  );
}
