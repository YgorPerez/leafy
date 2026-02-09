import { Dashboard } from "~/app/_components/dashboard";

export default function DashboardPage() {
	return (
		<div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-start">
			<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
				<div className="flex flex-col items-center gap-4 text-center">
					<h1 className="text-6xl font-extrabold tracking-tight sm:text-[6rem]">
						Leafy <span className="text-primary">Log</span>
					</h1>
					<p className="text-muted-foreground max-w-lg text-xl">
						Track your nutrition with precision.
					</p>
				</div>
				<Dashboard />
			</div>
		</div>
	);
}
