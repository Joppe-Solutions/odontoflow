"use client";

import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	Brain,
	ClipboardList,
	Cog,
	FileSearch,
	Heart,
	LayoutDashboard,
	LogOut,
	Pill,
	Users,
	Wallet,
} from "lucide-react";
import { OrganizationSwitcher, SignOutButton, useOrganization, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
	{ title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
	{ title: "Pacientes", icon: Users, path: "/dashboard/patients" },
	{ title: "Anamneses", icon: ClipboardList, path: "/dashboard/anamnesis" },
	{ title: "Exames", icon: FileSearch, path: "/dashboard/exams" },
	{ title: "Diagnósticos", icon: Brain, path: "/dashboard/diagnosis" },
	{ title: "Prescrições", icon: Pill, path: "/dashboard/prescriptions" },
];

const settingsItems = [
	{ title: "Assinatura", icon: Wallet, path: "/dashboard/subscription" },
	{ title: "Configurações", icon: Cog, path: "/dashboard/settings" },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const { organization } = useOrganization();
	const { user } = useUser();

	const isActive = (path: string) =>
		pathname === path || (path !== "/dashboard" && pathname.startsWith(`${path}/`));

	return (
		<Sidebar {...props}>
			<SidebarHeader className="p-4">
				<Link href="/dashboard" className="flex items-center gap-3">
					<div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
						<Heart className="h-4 w-4 text-sidebar-primary-foreground" />
					</div>
					<div className="flex flex-col">
						<span className="text-sm font-display font-bold text-sidebar-foreground">
							OdontoFlow
						</span>
						{organization?.name && (
							<span className="text-xs text-sidebar-foreground/50 truncate max-w-[140px]">
								{organization.name}
							</span>
						)}
					</div>
				</Link>

				<OrganizationSwitcher
					hidePersonal
					afterSelectOrganizationUrl="/dashboard"
					afterCreateOrganizationUrl="/dashboard"
				/>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Menu</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => (
								<SidebarMenuItem key={item.path}>
									<SidebarMenuButton asChild isActive={isActive(item.path)}>
										<Link href={item.path}>
											<item.icon className="h-4 w-4" />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel>Sistema</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{settingsItems.map((item) => (
								<SidebarMenuItem key={item.path}>
									<SidebarMenuButton asChild isActive={isActive(item.path)}>
										<Link href={item.path}>
											<item.icon className="h-4 w-4" />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="p-4">
				<div className="flex items-center justify-between">
					<div className="flex flex-col min-w-0">
						<span className="text-xs font-medium text-sidebar-foreground truncate">
							{user?.primaryEmailAddress?.emailAddress ?? "Usuário"}
						</span>
					</div>
					<SignOutButton redirectUrl="/sign-in">
						<Button
							variant="ghost"
							size="icon"
							className="shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground"
						>
							<LogOut className="h-4 w-4" />
						</Button>
					</SignOutButton>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
