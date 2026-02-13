function normalizeBaseURL(url: string): string {
	return url.endsWith("/") ? url.slice(0, -1) : url;
}

// Base URL for the frontend app used in Stripe redirects.
// Set FRONTEND_URL in Encore Cloud environments.
export const FRONTEND_URL = normalizeBaseURL(
	process.env.FRONTEND_URL || "http://localhost:3000",
);
