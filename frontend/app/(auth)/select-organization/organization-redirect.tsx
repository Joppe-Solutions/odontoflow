"use client";

import { useOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface OrganizationRedirectProps {
	afterSelectUrl: string;
}

export function OrganizationRedirect({ afterSelectUrl }: OrganizationRedirectProps) {
	const { isLoaded, organization } = useOrganization();
	const router = useRouter();

	useEffect(() => {
		if (isLoaded && organization?.id) {
			router.replace(afterSelectUrl);
		}
	}, [afterSelectUrl, isLoaded, organization?.id, router]);

	return null;
}
