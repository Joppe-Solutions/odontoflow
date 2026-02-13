import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getApiClient } from "@/lib/api/server-side";

interface DashboardStats {
	totalUsers: number;
	totalOrders: number;
	totalRevenue: number;
	totalPatients: number;
	activePatients: number;
	archivedPatients: number;
	totalExams: number;
	readyExams: number;
	processingExams: number;
	pendingExams: number;
	errorExams: number;
	totalAnamnesisSubmissions: number;
	completedSubmissions: number;
	inProgressSubmissions: number;
	pendingSubmissions: number;
	expiredSubmissions: number;
	hasActiveSubscription: boolean;
	activeSubscriptionPriceId?: string;
}

export async function ServerSideData() {
	try {
		const apiClient = await getApiClient();
		const data = (await apiClient.admin.getDashboardData()) as unknown as DashboardStats;

		return (
			<div className="space-y-6">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Total Patients</CardDescription>
							<CardTitle className="text-3xl">{data.totalPatients}</CardTitle>
						</CardHeader>
						<CardContent className="text-xs text-muted-foreground">
							Active: {data.activePatients} | Archived: {data.archivedPatients}
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Total Exams</CardDescription>
							<CardTitle className="text-3xl">{data.totalExams}</CardTitle>
						</CardHeader>
						<CardContent className="text-xs text-muted-foreground">
							Ready: {data.readyExams} | Processing: {data.processingExams}
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Anamnesis Submissions</CardDescription>
							<CardTitle className="text-3xl">{data.totalAnamnesisSubmissions}</CardTitle>
						</CardHeader>
						<CardContent className="text-xs text-muted-foreground">
							Completed: {data.completedSubmissions} | In Progress: {data.inProgressSubmissions}
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Subscription</CardDescription>
							<CardTitle className="text-base font-semibold">
								{data.hasActiveSubscription ? "Active" : "Not Active"}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Badge variant={data.hasActiveSubscription ? "default" : "secondary"}>
								{data.activeSubscriptionPriceId ?? "No current plan"}
							</Badge>
						</CardContent>
					</Card>
				</div>

				<div className="grid gap-4 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Exams Pipeline</CardTitle>
							<CardDescription>Current workload and review status.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span>Pending</span>
								<span className="font-medium">{data.pendingExams}</span>
							</div>
							<div className="flex justify-between">
								<span>Processing</span>
								<span className="font-medium">{data.processingExams}</span>
							</div>
							<div className="flex justify-between">
								<span>Ready</span>
								<span className="font-medium">{data.readyExams}</span>
							</div>
							<div className="flex justify-between">
								<span>Error</span>
								<span className="font-medium">{data.errorExams}</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Anamnesis Pipeline</CardTitle>
							<CardDescription>Form statuses across all patients.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span>Pending</span>
								<span className="font-medium">{data.pendingSubmissions}</span>
							</div>
							<div className="flex justify-between">
								<span>In Progress</span>
								<span className="font-medium">{data.inProgressSubmissions}</span>
							</div>
							<div className="flex justify-between">
								<span>Completed</span>
								<span className="font-medium">{data.completedSubmissions}</span>
							</div>
							<div className="flex justify-between">
								<span>Expired</span>
								<span className="font-medium">{data.expiredSubmissions}</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	} catch (error) {
		const status = typeof error === "object" && error && "status" in error
			? Number((error as { status?: unknown }).status)
			: undefined;

		return (
			<Card>
				<CardHeader>
					<CardTitle>Dashboard unavailable</CardTitle>
					<CardDescription>
						The backend rejected the request. Check auth and backend deployment status.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{status ? `Backend status: ${status}` : "Unknown backend error"}
				</CardContent>
			</Card>
		);
	}
}
