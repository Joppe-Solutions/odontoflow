"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserButton, useAuth, useOrganization } from "@clerk/nextjs";
import { AppSidebar } from "./app-sidebar";

export default function DashboardLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const { orgRole } = useAuth();
	const { organization } = useOrganization();

	const roleLabels: Record<string, string> = {
		admin: "Admin",
		dentista: "Dentista",
		auxiliar: "Auxiliar",
	};

	const normalizedRole = orgRole?.replace("org:", "");
	const roleLabel = normalizedRole ? roleLabels[normalizedRole] ?? normalizedRole : null;

	return (
		<SidebarProvider>
			<div className="flex min-h-screen w-full">
				<AppSidebar />
				<main className="flex-1 flex flex-col">
					<header className="flex items-center justify-between h-14 px-4 border-b bg-card/50 backdrop-blur-sm">
						<div className="flex items-center gap-3">
							<SidebarTrigger />
							{organization?.name && (
								<span className="text-sm font-medium text-muted-foreground hidden sm:inline">
									{organization.name}
								</span>
							)}
						</div>
						<div className="flex items-center gap-3">
							{roleLabel && (
								<Badge variant="secondary" className="text-xs">
									{roleLabel}
								</Badge>
							)}
							<ThemeToggle />
							<UserButton />
						</div>
					</header>
					<div className="flex-1 p-4 md:p-6 overflow-auto">{children}</div>
				</main>
			</div>
		</SidebarProvider>
	);
}
