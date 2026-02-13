import { z } from "zod";

const serverSideEnvSchema = z.object({
	VERCEL_ENV: z.enum(["development", "preview", "production"]).default("development"),
	VERCEL_GIT_PULL_REQUEST_ID: z
		.string()
		.optional()
		.transform((v) => (v === "" ? undefined : v)), // Treat an empty string as undefined
	ENCORE_ENV_NAME: z
		.string()
		.optional()
		.transform((v) => (v === "" ? undefined : v)),
});

/**
 * Type-safe environment variables available server-side
 */
export const serverSideEnv = serverSideEnvSchema.parse({
	VERCEL_ENV: process.env.VERCEL_ENV,
	VERCEL_GIT_PULL_REQUEST_ID: process.env.VERCEL_GIT_PULL_REQUEST_ID,
	ENCORE_ENV_NAME: process.env.ENCORE_ENV_NAME,
});
