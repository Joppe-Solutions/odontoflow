import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getApiClient } from "@/lib/api/server-side";
import { Activity, ClipboardList, FileSearch, Users } from "lucide-react";

interface DashboardStats {
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
	totalPrescriptions?: number;
	draftPrescriptions?: number;
	signedPrescriptions?: number;
	cancelledPrescriptions?: number;
	hasActiveSubscription: boolean;
	activeSubscriptionPriceId?: string;
}

function formatNumber(value: number | undefined) {
	return String(value ?? 0);
}

export async function ServerSideData() {
	try {
		const apiClient = await getApiClient();
		const data = (await apiClient.admin.getDashboardData()) as unknown as DashboardStats;

		const stats = [
			{
				title: "Pacientes ativos",
				value: formatNumber(data.activePatients),
				icon: Users,
				color: "text-primary",
			},
			{
				title: "Anamneses pendentes",
				value: formatNumber(data.pendingSubmissions),
				icon: ClipboardList,
				color: "text-info",
			},
			{
				title: "Exames recentes",
				value: formatNumber(data.totalExams),
				icon: FileSearch,
				color: "text-warning",
			},
			{
				title: "Prescrições assinadas",
				value: formatNumber(data.signedPrescriptions),
				icon: Activity,
				color: "text-success",
			},
		];

		return (
			<div className="space-y-6 animate-fade-in">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{stats.map((stat) => (
						<Card key={stat.title} className="hover:shadow-md transition-shadow">
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardDescription className="text-sm font-medium">
									{stat.title}
								</CardDescription>
								<stat.icon className={`h-4 w-4 ${stat.color}`} />
							</CardHeader>
							<CardContent>
								<p className="text-3xl font-display font-bold">{stat.value}</p>
							</CardContent>
						</Card>
					))}
				</div>

				<div className="grid gap-4 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-display">Pipeline clínico</CardTitle>
							<CardDescription>Status atual de exames e anamneses</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span>Exames pendentes</span>
								<span className="font-medium">{formatNumber(data.pendingExams)}</span>
							</div>
							<div className="flex justify-between">
								<span>Exames em processamento</span>
								<span className="font-medium">{formatNumber(data.processingExams)}</span>
							</div>
							<div className="flex justify-between">
								<span>Submissões em progresso</span>
								<span className="font-medium">{formatNumber(data.inProgressSubmissions)}</span>
							</div>
							<div className="flex justify-between">
								<span>Submissões expiradas</span>
								<span className="font-medium">{formatNumber(data.expiredSubmissions)}</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-display">Assinatura e produção</CardTitle>
							<CardDescription>Plano atual e volume operacional da clínica</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm">Assinatura</span>
								<Badge variant={data.hasActiveSubscription ? "default" : "secondary"}>
									{data.hasActiveSubscription ? "Ativa" : "Inativa"}
								</Badge>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Plano</span>
								<span className="text-sm font-medium">
									{data.activeSubscriptionPriceId ?? "Sem plano ativo"}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Total de pacientes</span>
								<span className="text-sm font-medium">{formatNumber(data.totalPatients)}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Anamneses concluídas</span>
								<span className="text-sm font-medium">
									{formatNumber(data.completedSubmissions)}
								</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	} catch (error) {
		const status =
			typeof error === "object" && error && "status" in error
				? Number((error as { status?: unknown }).status)
				: undefined;

		return (
			<Card>
				<CardHeader>
					<CardTitle className="font-display">Dashboard indisponível</CardTitle>
					<CardDescription>
						O backend rejeitou a requisição. Verifique autenticação e deploy.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{status ? `Status retornado pelo backend: ${status}` : "Erro desconhecido no backend"}
				</CardContent>
			</Card>
		);
	}
}
