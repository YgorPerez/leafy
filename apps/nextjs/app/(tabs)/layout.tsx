import type { UserProfile } from "@acme/api";
import { calculateDRI } from "@acme/api";
import { db } from "@acme/db/client";
import { user } from "@acme/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { BottomNav } from "~/app/_components/bottom-nav";
import { UserProvider } from "~/app/_context/user-context";
import { ModeToggle } from "~/components/mode-toggle";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient } from "~/trpc/server";

export default async function TabsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();

	if (!session?.user) {
		redirect("/login");
	}

	let metrics = null;
	let customGoals:
		| Record<string, { target?: number; min?: number; max?: number }>
		| undefined;

	const dbUser = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
	});

	if (!dbUser?.onboardedAt) {
		redirect("/onboarding");
	}

	if (
		dbUser?.sex &&
		dbUser?.weight &&
		dbUser?.height &&
		dbUser?.birthDate &&
		dbUser?.activityLevel
	) {
		const age = new Date().getFullYear() - dbUser.birthDate.getFullYear();
		const profile: UserProfile = {
			sex: dbUser.sex as "male" | "female",
			age,
			weight: dbUser.weight,
			height: dbUser.height,
			activityLevel: dbUser.activityLevel as
				| "sedentary"
				| "low"
				| "active"
				| "very_active",
		};
		metrics = calculateDRI(profile);
	}

	customGoals = dbUser?.goals ?? undefined;

	return (
		<HydrateClient>
			<UserProvider
				metrics={metrics}
				customGoals={customGoals}
				dashboardConfig={dbUser?.dashboardConfig ?? null}
			>
				<div className="relative min-h-screen">
					<div className="absolute top-4 right-4 z-50">
						<ModeToggle />
					</div>
					<main className="pb-20">{children}</main>
					<BottomNav />
				</div>
			</UserProvider>
		</HydrateClient>
	);
}
