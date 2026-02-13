import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { OrganizationList } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrganizationRedirect } from "./organization-redirect";

interface PageProps {
	searchParams: Promise<{
		redirect_url?: string;
	}>;
}

function sanitizeRedirectPath(path: string | undefined): string {
	if (!path || !path.startsWith("/")) {
		return "/dashboard";
	}
	return path;
}

/**
 * This page renders the Clerk OrganizationList component.
 * See https://clerk.com/docs/components/organization/organization-list for more information.
 */
export default async function SelectOrganizationPage({ searchParams }: PageProps) {
	const { orgId } = await auth();
	const { redirect_url } = await searchParams;

	const afterSelectUrl = sanitizeRedirectPath(redirect_url);

	if (orgId) {
		redirect(afterSelectUrl);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-6">
			<OrganizationRedirect afterSelectUrl={afterSelectUrl} />

			<Card className="w-full max-w-lg shadow-lg animate-fade-in">
				<CardHeader className="text-center">
					<div className="mx-auto h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
						<Building2 className="h-7 w-7 text-accent-foreground" />
					</div>
					<CardTitle className="text-2xl font-display">Selecione sua clínica</CardTitle>
					<CardDescription>
						Escolha uma organização para continuar no sistema.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<OrganizationList
						afterSelectOrganizationUrl={afterSelectUrl}
						afterCreateOrganizationUrl={afterSelectUrl}
						hidePersonal
					/>

					<Button asChild variant="ghost" className="w-full">
						<Link href={afterSelectUrl}>Continuar para o dashboard</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
