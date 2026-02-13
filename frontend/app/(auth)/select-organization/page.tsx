import { Button } from "@/components/ui/button";
import { OrganizationList } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
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
		<div className="min-h-screen flex flex-col gap-4 items-center justify-center">
			<OrganizationRedirect afterSelectUrl={afterSelectUrl} />

			<h1 className="text-2xl font-semibold">Select Organization</h1>
			<p className="text-muted-foreground">Select an organization to continue.</p>

			<OrganizationList
				afterSelectOrganizationUrl={afterSelectUrl}
				afterCreateOrganizationUrl={afterSelectUrl}
				hidePersonal
			/>

			<Button asChild variant="ghost">
				<Link href={afterSelectUrl}>Continue to dashboard</Link>
			</Button>
		</div>
	);
}
