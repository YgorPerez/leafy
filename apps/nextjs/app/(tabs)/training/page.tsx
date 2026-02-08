import { Dumbbell } from "lucide-react";

import { Badge } from "~/components/ui/badge";

export default function TrainingPage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-start">
      <div className="container flex flex-col items-center gap-8 px-4 py-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-primary/10 rounded-full p-6">
            <Dumbbell className="text-primary h-12 w-12" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Training</h1>
          <Badge variant="secondary" className="text-sm">
            Coming Soon
          </Badge>
          <p className="text-muted-foreground max-w-md text-lg">
            Log your workouts, track sets and reps, and monitor your training
            progress. Integrate with your nutrition data for a complete picture
            of your fitness journey.
          </p>
        </div>
      </div>
    </div>
  );
}
