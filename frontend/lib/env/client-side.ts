import { z } from "zod";

const clientSideEnvSchema = z.object({
	NEXT_PUBLIC_VERCEL_ENV: z
		.enum(["development", "preview", "production"])
		.default("development"),
	NEXT_PUBLIC_VERCEL_GIT_PULL_REQUEST_ID: z
		.string()
		.optional()
		.transform((v) => (v === "" ? undefined : v)), // Treat an empty string as undefined
	NEXT_PUBLIC_ENCORE_ENV_NAME: z
		.string()
		.optional()
		.transform((v) => (v === "" ? undefined : v)),
});

/**
 * Type-safe environment variables available client-side
 */
export const clientSideEnv = clientSideEnvSchema.parse({
	NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
	NEXT_PUBLIC_VERCEL_GIT_PULL_REQUEST_ID:
		process.env.NEXT_PUBLIC_VERCEL_GIT_PULL_REQUEST_ID,
	NEXT_PUBLIC_ENCORE_ENV_NAME: process.env.NEXT_PUBLIC_ENCORE_ENV_NAME,
});
