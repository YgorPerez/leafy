"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";

export function ProfileForm({ onSuccess }: { onSuccess?: () => void }) {
  const [sex, setSex] = useState<"male" | "female">("male");
  const [birthDate, setBirthDate] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activityLevel, setActivityLevel] = useState("sedentary");

  const updateProfileMutation = api.food.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      if (onSuccess) onSuccess();
      // Force reload to refresh server components
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate || !weight || !height) {
      toast.error("Please fill in all fields");
      return;
    }

    updateProfileMutation.mutate({
      sex,
      birthDate: new Date(birthDate),
      weight: parseFloat(weight),
      height: parseFloat(height),
      activityLevel: activityLevel as any,
    });
  };

  return (
    <Card className="w-full max-w-lg border-primary/20 bg-black/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>
          We need a few details to calculate your nutritional targets
          accurately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <Select
                value={sex}
                onValueChange={(v) => setSex(v as "male" | "female")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Date of Birth</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="1"
                placeholder="175"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity">Activity Level</Label>
            <Select value={activityLevel} onValueChange={setActivityLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">
                  Sedentary (Little or no exercise)
                </SelectItem>
                <SelectItem value="low">
                  Low Active (Light exercise 1-3 days/week)
                </SelectItem>
                <SelectItem value="active">
                  Active (Moderate exercise 3-5 days/week)
                </SelectItem>
                <SelectItem value="very_active">
                  Very Active (Hard exercise 6-7 days/week)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending
              ? "Saving..."
              : "Calculate Targets"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
