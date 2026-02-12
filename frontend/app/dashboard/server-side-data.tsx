import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getApiClient } from "@/lib/api/server-side";

/**
 * This component shows how you can fetch data from the encore backend using server components.
 */
export async function ServerSideData() {
	try {
		const apiClient = await getApiClient();
		const data = await apiClient.admin.getDashboardData();

		return (
			<Card>
				<CardHeader>
					<CardTitle>Server side data</CardTitle>
					<CardDescription>
						This data is fetched from the backend using server components
					</CardDescription>
				</CardHeader>
				<CardContent>{JSON.stringify(data)}</CardContent>
			</Card>
		);
	} catch (error) {
		const status = typeof error === "object" && error && "status" in error
			? Number((error as { status?: unknown }).status)
			: undefined;

		return (
			<Card>
				<CardHeader>
					<CardTitle>Server side data unavailable</CardTitle>
					<CardDescription>
						The backend rejected the auth token. Check Clerk/Encore secret configuration.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{status ? `Backend status: ${status}` : "Unknown backend error"}
				</CardContent>
			</Card>
		);
	}
}
