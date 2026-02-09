"use client";

import {
	ClipboardList,
	Dumbbell,
	FlaskConical,
	LayoutDashboard,
	User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "~/lib/utils";

const tabs = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/log", label: "Log", icon: ClipboardList },
	{ href: "/exams", label: "Exams", icon: FlaskConical },
	{ href: "/training", label: "Training", icon: Dumbbell },
	{ href: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
	const pathname = usePathname();

	return (
		<nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-xl">
			<div className="mx-auto flex h-16 max-w-lg items-center justify-around">
				{tabs.map(({ href, label, icon: Icon }) => {
					const isActive = pathname === href || pathname.startsWith(href + "/");
					return (
						<Link
							key={href}
							href={href}
							className={cn(
								"flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
								isActive
									? "text-primary"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<Icon className="h-5 w-5" />
							<span className="font-medium">{label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
