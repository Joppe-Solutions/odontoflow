import { ServerSideData } from "./server-side-data";

export default function DashboardPage() {
	return (
		<div className="space-y-6 animate-fade-in">
			<div>
				<h1 className="text-2xl font-display font-bold">Visão geral da clínica</h1>
				<p className="text-muted-foreground mt-1">Indicadores operacionais em tempo real.</p>
			</div>

			<ServerSideData />
		</div>
	);
}
