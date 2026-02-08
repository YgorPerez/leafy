"use client";

import { Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { WIDGET_REGISTRY } from "./widget-registry";

interface WidgetGalleryProps {
  activeWidgetIds: string[];
  onAdd: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WidgetGallery({
  activeWidgetIds,
  onAdd,
  open,
  onOpenChange,
}: WidgetGalleryProps) {
  const availableWidgets = Object.values(WIDGET_REGISTRY).filter(
    (widget) => !activeWidgetIds.includes(widget.id),
  );

  if (availableWidgets.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-white/10 bg-white/5 text-xs hover:bg-white/10"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {availableWidgets.map((widget) => {
            const Icon = widget.icon;
            return (
              <button
                key={widget.id}
                onClick={() => {
                  onAdd(widget.id);
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/10"
              >
                <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                  <Icon className="text-primary h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-foreground font-medium">{widget.name}</h4>
                  <p className="text-muted-foreground text-sm">
                    {widget.description}
                  </p>
                </div>
                <Plus className="text-muted-foreground h-4 w-4 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
