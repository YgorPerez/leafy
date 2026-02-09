import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";

export default async function OnboardingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();
	if (!session?.user) {
		redirect("/login");
	}

	return <div className="relative min-h-screen">{children}</div>;
}
