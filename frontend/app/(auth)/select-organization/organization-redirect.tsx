"use client";

import { useOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function OrganizationRedirect() {
	const { isLoaded, organization } = useOrganization();
	const router = useRouter();

	useEffect(() => {
		if (isLoaded && organization?.id) {
			router.replace("/dashboard");
		}
	}, [isLoaded, organization?.id, router]);

	return null;
}
