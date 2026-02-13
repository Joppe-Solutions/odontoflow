import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
	"/",
	"/pricing",
	"/sign-in(.*)",
	"/form/(.*)",
	"/api/anamnesis/form/(.*)",
]);
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isSelectOrganizationRoute = createRouteMatcher(["/select-organization(.*)"]);

function sanitizeRedirectPath(path: string | null): string {
	if (!path || !path.startsWith("/")) {
		return "/dashboard";
	}
	return path;
}

export default clerkMiddleware(async (auth, request) => {
	const isPublic = isPublicRoute(request);

	if (!isPublic) {
		await auth.protect();
	}

	const { orgId } = await auth();

	if (isDashboardRoute(request) && !orgId) {
		const selectOrgUrl = new URL("/select-organization", request.url);
		const targetPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
		selectOrgUrl.searchParams.set("redirect_url", targetPath);
		return NextResponse.redirect(selectOrgUrl);
	}

	if (isSelectOrganizationRoute(request) && orgId) {
		const redirectParam = sanitizeRedirectPath(
			request.nextUrl.searchParams.get("redirect_url"),
		);
		return NextResponse.redirect(new URL(redirectParam, request.url));
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
