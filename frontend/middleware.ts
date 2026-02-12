import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
	"/",
	"/pricing",
	"/sign-in(.*)",
	"/form/(.*)",
]);

// All dashboard routes require an organization
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, request) => {
	const isPublic = isPublicRoute(request);

	if (!isPublic) {
		await auth.protect();
	}

	// All dashboard routes require an organization
	if (isDashboardRoute(request) && request.nextUrl.pathname !== "/select-organization") {
		const { orgId } = await auth();

		if (!orgId) {
			const selectOrgUrl = new URL("/select-organization", request.url);
			const redirectPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
			selectOrgUrl.searchParams.set("redirect_url", redirectPath);
			return NextResponse.redirect(selectOrgUrl);
		}
	}
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
