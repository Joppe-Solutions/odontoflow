import { OrganizationList } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface PageProps {
	searchParams: Promise<{
		redirect_url?: string;
	}>;
}

/**
 * This page renders the Clerk OrganizationList component.
 * See https://clerk.com/docs/components/organization/organization-list for more information.
 */
export default async function SelectOrganizationPage({ searchParams }: PageProps) {
	const { orgId } = await auth();
	const { redirect_url } = await searchParams;

	// Determine where to redirect after org selection
	const afterSelectUrl = redirect_url || "/dashboard";

	// If user already has an org, redirect immediately
	if (orgId) {
		redirect(afterSelectUrl);
	}

	return (
		<div className="min-h-screen flex flex-col gap-4 items-center justify-center">
			<h1 className="text-2xl font-semibold">Select Organization</h1>
			<p className="text-muted-foreground">Select an organization to continue.</p>

			<OrganizationList
				afterSelectOrganizationUrl={afterSelectUrl}
				afterCreateOrganizationUrl={afterSelectUrl}
				hidePersonal
			/>
		</div>
	);
}
