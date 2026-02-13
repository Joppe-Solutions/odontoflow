import { ServerSideData } from "./server-side-data";

export default function DashboardPage() {
	return (
		<div className="container mx-auto max-w-6xl space-y-6">
			<div>
				<h1 className="text-3xl font-semibold">Dashboard</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Operational overview of patients, exams, anamnesis, and subscription.
				</p>
			</div>

			<ServerSideData />
		</div>
	);
}
