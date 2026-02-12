import { OrganizationList } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * This page renders the Clerk CreateOrganization component.
 * See https://clerk.com/docs/components/organization/create-organization for more information.
 */
export default async function SelectOrganizationPage() {
	const { orgId } = await auth();

	if (orgId) {
		redirect("/dashboard");
	}

	return (
		<div className="min-h-screen flex flex-col gap-4 items-center justify-center">
			<p>Select an organization to continue.</p>

			<OrganizationList
				afterSelectOrganizationUrl="/dashboard"
				afterCreateOrganizationUrl="/dashboard"
				hidePersonal
			/>
		</div>
	);
}
