import { createClerkClient, verifyToken } from "@clerk/backend";
import { APIError, Gateway, type Header } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
import log from "encore.dev/log";

// This secret is defined in Encore.
// See https://encore.dev/docs/ts/primitives/secrets for more information.
const clerkSecretKey = secret("ClerkSecretKey");
const clerk = createClerkClient({
	secretKey: clerkSecretKey(),
});

// AuthParams specifies the incoming request information
// the auth handler is interested in. In this case it only
// cares about requests that contain the `Authorization` header.
interface AuthParams {
	authorization: Header<"Authorization">;
	xOrganizationId?: Header<"X-Organization-Id">;
}

// The AuthData specifies the information about the authenticated user
// that the auth handler makes available.
interface AuthData {
	// This user id is the clerk user id.
	// More information about the user can be fetched with the clerk client.
	userID: string;
	// This org id is the clerk organization id.
	// More information about the organization can be fetched with the clerk client.
	orgID: string;
}

// The auth handler itself.
export const auth = authHandler<AuthParams, AuthData>(async (params) => {
	try {
		const token = params.authorization.replace("Bearer ", "");

		// See https://clerk.com/docs/references/backend/verify-token for more information about the `verifyToken` function.
		const verifiedToken = await verifyToken(token, {
			secretKey: clerkSecretKey(),
		});

		let orgID = verifiedToken.org_id ?? "";
		const requestedOrgID = params.xOrganizationId?.trim();

		// Server-side requests can provide the active org context explicitly.
		// If it's missing in the token, verify membership before trusting it.
		if (!orgID && requestedOrgID) {
			const memberships = await clerk.users.getOrganizationMembershipList({
				userId: verifiedToken.sub,
				limit: 100,
			});

			const isMember = memberships.data.some(
				(membership) => membership.organization.id === requestedOrgID,
			);

			if (!isMember) {
				throw APIError.unauthenticated("invalid organization context");
			}

			orgID = requestedOrgID;
		}

		return {
			userID: verifiedToken.sub,
			orgID,
		};
	} catch (error) {
		if (error instanceof APIError) {
			throw error;
		}
		log.error("could not verify clerk token", { error });
		throw APIError.unauthenticated("could not verify token");
	}
});

// Define the API Gateway that will execute the auth handler:
export const gateway = new Gateway({
	authHandler: auth,
});
