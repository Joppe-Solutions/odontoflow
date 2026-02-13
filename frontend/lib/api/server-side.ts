import { serverSideEnv } from "@/lib/env/server-side";
import { auth } from "@clerk/nextjs/server";
import Client, { Environment, Local, PreviewEnv } from "./encore-client";

// Get the correct encore environment
let environment = Local;
if (serverSideEnv.ENCORE_ENV_NAME) {
	environment = Environment(serverSideEnv.ENCORE_ENV_NAME);
} else if (serverSideEnv.VERCEL_ENV === "production") {
	environment = Environment("staging");
} else if (serverSideEnv.VERCEL_ENV === "preview") {
	if (!serverSideEnv.VERCEL_GIT_PULL_REQUEST_ID) {
		throw new Error("VERCEL_GIT_PULL_REQUEST_ID is not set");
	}
	environment = PreviewEnv(serverSideEnv.VERCEL_GIT_PULL_REQUEST_ID);
}

/**
 * Get an authenticated encore API client.
 *
 * Meant to be used to use on the server side.
 */
export async function getApiClient() {
	const { getToken, orgId } = await auth();

	return new Client(environment, {
		auth: async () => {
			const token = await getToken();
			return {
				authorization: `Bearer ${token}`,
				...(orgId ? { "x-organization-id": orgId } : {}),
			};
		},
	});
}
