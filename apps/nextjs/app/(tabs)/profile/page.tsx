import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ProfileForm } from "~/app/_components/profile-form";
import { Button } from "~/components/ui/button";
import { auth } from "~/server/better-auth";

export default function ProfilePage() {
	return (
		<div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-start">
			<div className="container flex flex-col items-center gap-8 px-4 py-16">
				<h1 className="text-3xl font-bold tracking-tight">Profile</h1>

				<div className="w-full max-w-lg">
					<ProfileForm />
				</div>

				<form>
					<Button
						className="rounded-full px-10 py-6 text-lg font-semibold"
						formAction={async () => {
							"use server";
							await auth.api.signOut({
								headers: await headers(),
							});
							redirect("/login");
						}}
						size="lg"
						variant="outline"
					>
						Sign out
					</Button>
				</form>
			</div>
		</div>
	);
}
