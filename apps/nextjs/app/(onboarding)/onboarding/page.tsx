import { db } from "@acme/db/client";
import { user } from "@acme/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { OnboardingWizard } from "~/app/_components/onboarding/wizard";
import { getSession } from "~/server/better-auth/server";

export default async function OnboardingPage() {
	const session = await getSession();
	if (!session?.user) redirect("/login");

	const dbUser = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
	});

	if (dbUser?.onboardedAt) {
		redirect("/dashboard");
	}

	return <OnboardingWizard userName={dbUser?.name ?? undefined} />;
}
