import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { OrganizationSwitcher } from "@clerk/nextjs";
import {
	Brain,
	ClipboardList,
	Cog,
	FileText,
	LayoutDashboard,
	Pill,
	Users,
	Wallet,
} from "lucide-react";
import Link from "next/link";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
	const { ...rest } = props;

	return (
		<Sidebar {...rest}>
			<SidebarHeader>
				<OrganizationSwitcher
					hidePersonal
					afterSelectOrganizationUrl="/dashboard"
				/>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link href="/dashboard">
									<LayoutDashboard /> Dashboard
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link href="/dashboard/patients">
									<Users /> Patients
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link href="/dashboard/anamnesis">
									<ClipboardList /> Anamnesis
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link href="/dashboard/exams">
									<FileText /> Exams
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link href="/dashboard/diagnosis">
									<Brain /> Diagnosis
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link href="/dashboard/prescriptions">
									<Pill /> Prescriptions
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link href="/dashboard/subscription">
									<Wallet /> Subscription
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link href="/dashboard/settings">
									<Cog /> Settings
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
