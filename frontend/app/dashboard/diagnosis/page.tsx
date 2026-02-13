import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	listDiagnoses,
	type DiagnosisStatus,
	type ListDiagnosesResponse,
} from "@/lib/api/diagnosis-server";
import { listPatients, type ListPatientsResponse } from "@/lib/api/patients-server";
import Link from "next/link";
import { Brain, AlertTriangle, FileEdit, CheckCircle2 } from "lucide-react";

const STATUS_LABEL: Record<DiagnosisStatus, string> = {
	draft: "Rascunho",
	reviewed: "Revisado",
};

const STATUS_VARIANT: Record<DiagnosisStatus, "default" | "secondary"> = {
	draft: "secondary",
	reviewed: "default",
};

const STATUS_ICONS: Record<DiagnosisStatus, React.ReactNode> = {
	draft: <FileEdit className="h-3 w-3" />,
	reviewed: <CheckCircle2 className="h-3 w-3" />,
};

function extractErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return "Erro desconhecido";
}

export default async function DiagnosisPage() {
	let diagnosisError: string | undefined;
	let diagnoses: ListDiagnosesResponse = { items: [], total: 0 };
	let patients: ListPatientsResponse = { items: [], total: 0 };

	try {
		[diagnoses, patients] = await Promise.all([
			listDiagnoses({ limit: 100, offset: 0 }),
			listPatients({ limit: 200, offset: 0 }),
		]);
	} catch (error) {
		diagnosisError = extractErrorMessage(error);
	}

	const patientNameById = new Map(
		patients.items.map((patient) => [patient.id, patient.name]),
	);

	return (
		<div className="space-y-6 animate-fade-in">
			<div>
				<h1 className="text-2xl font-display font-bold">Diagnósticos</h1>
				<p className="text-muted-foreground mt-1">
					Histórico de análises clínicas assistidas por IA.
				</p>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
							<Brain className="h-5 w-5 text-primary" />
						</div>
						<div>
							<CardTitle className="text-lg font-display">Registro de Diagnósticos</CardTitle>
							<CardDescription>
								{diagnosisError
									? "Serviço de diagnóstico indisponível no ambiente atual."
									: `${diagnoses.total} análise${diagnoses.total !== 1 ? "s" : ""} registrada${diagnoses.total !== 1 ? "s" : ""}`}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{diagnosisError ? (
						<div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-lg">
							<AlertTriangle className="h-5 w-5 shrink-0" />
							<div>
								<p className="font-medium">Erro ao carregar diagnósticos</p>
								<p className="text-sm opacity-80">{diagnosisError}</p>
							</div>
						</div>
					) : diagnoses.items.length === 0 ? (
						<div className="text-center py-12">
							<Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
							<p className="font-medium">Nenhum diagnóstico registrado</p>
							<p className="text-muted-foreground text-sm mt-1">
								Os diagnósticos são gerados a partir dos exames dos pacientes.
							</p>
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Resumo</TableHead>
										<TableHead>Paciente</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Confiança</TableHead>
										<TableHead>Data</TableHead>
										<TableHead className="text-right">Ações</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{diagnoses.items.map((diagnosis) => (
										<TableRow key={diagnosis.id}>
											<TableCell className="max-w-md">
												<p className="font-medium truncate">{diagnosis.summary}</p>
											</TableCell>
											<TableCell>
												<Link
													href={`/dashboard/patients/${diagnosis.patientId}`}
													className="text-primary hover:underline"
												>
													{patientNameById.get(diagnosis.patientId) ?? "Paciente"}
												</Link>
											</TableCell>
											<TableCell>
												<Badge variant={STATUS_VARIANT[diagnosis.status]} className="gap-1">
													{STATUS_ICONS[diagnosis.status]}
													{STATUS_LABEL[diagnosis.status]}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
														<div
															className="h-full bg-primary rounded-full"
															style={{ width: `${diagnosis.confidence}%` }}
														/>
													</div>
													<span className="text-sm text-muted-foreground">
														{diagnosis.confidence}%
													</span>
												</div>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{new Date(diagnosis.createdAt).toLocaleDateString("pt-BR")}
											</TableCell>
											<TableCell className="text-right">
												<Button asChild variant="outline" size="sm">
													<Link href={`/dashboard/patients/${diagnosis.patientId}/diagnosis`}>
														Abrir
													</Link>
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
