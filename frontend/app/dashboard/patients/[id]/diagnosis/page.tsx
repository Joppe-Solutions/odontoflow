import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
	analyzePatientDiagnosis,
	listDiagnoses,
	reviewDiagnosis,
	type ListDiagnosesResponse,
	type DiagnosisStatus,
} from "@/lib/api/diagnosis-server";
import { getPatient } from "@/lib/api/patients-server";
import { Brain, ArrowLeft, AlertTriangle, Sparkles, CheckCircle2, FileEdit, History } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

interface PageProps {
	params: Promise<{ id: string }>;
}

const STATUS_CONFIG: Record<DiagnosisStatus, { label: string; variant: "default" | "secondary"; icon: React.ReactNode }> = {
	draft: { label: "Rascunho", variant: "secondary", icon: <FileEdit className="h-3 w-3" /> },
	reviewed: { label: "Revisado", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
	low: { label: "Baixa", color: "text-green-600" },
	medium: { label: "Média", color: "text-yellow-600" },
	high: { label: "Alta", color: "text-red-600" },
};

function extractErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return "Erro desconhecido";
}

async function analyzeAction(formData: FormData) {
	"use server";

	const patientId = String(formData.get("patientId") || "");
	if (!patientId) {
		throw new Error("ID do paciente não informado");
	}

	await analyzePatientDiagnosis(patientId);
	revalidatePath(`/dashboard/patients/${patientId}`);
	revalidatePath(`/dashboard/patients/${patientId}/diagnosis`);
	redirect(`/dashboard/patients/${patientId}/diagnosis`);
}

async function reviewAction(formData: FormData) {
	"use server";

	const patientId = String(formData.get("patientId") || "");
	const diagnosisId = String(formData.get("diagnosisId") || "");
	const notes = String(formData.get("clinicalNotes") || "").trim();

	if (!patientId || !diagnosisId) {
		throw new Error("Identificadores ausentes");
	}

	await reviewDiagnosis(diagnosisId, notes || undefined);
	revalidatePath(`/dashboard/patients/${patientId}/diagnosis`);
	redirect(`/dashboard/patients/${patientId}/diagnosis`);
}

export default async function PatientDiagnosisPage({ params }: PageProps) {
	const { id: patientId } = await params;

	let patient;
	try {
		patient = await getPatient(patientId);
	} catch {
		notFound();
	}

	let diagnosisError: string | undefined;
	let diagnosisList: ListDiagnosesResponse = { items: [], total: 0 };
	try {
		diagnosisList = await listDiagnoses({ patientId, limit: 10, offset: 0 });
	} catch (error) {
		diagnosisError = extractErrorMessage(error);
	}

	const latest = diagnosisList.items[0];

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="flex items-start gap-4">
					<Button asChild variant="ghost" size="icon" className="shrink-0 mt-1">
						<Link href={`/dashboard/patients/${patientId}`}>
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<h1 className="text-2xl font-display font-bold">Diagnóstico</h1>
						<p className="text-muted-foreground mt-1">
							Análise clínica assistida por IA para {patient.name}
						</p>
					</div>
				</div>
				<div className="flex gap-2 ml-12 sm:ml-0">
					<Button asChild variant="outline">
						<Link href={`/dashboard/patients/${patientId}/prescriptions`}>
							Prescrições
						</Link>
					</Button>
					<form action={analyzeAction}>
						<input type="hidden" name="patientId" value={patientId} />
						<Button type="submit">
							<Sparkles className="h-4 w-4 mr-2" />
							Nova Análise
						</Button>
					</form>
				</div>
			</div>

			{diagnosisError ? (
				<Card className="border-destructive/50">
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
								<AlertTriangle className="h-5 w-5 text-destructive" />
							</div>
							<div>
								<CardTitle className="text-lg font-display">Serviço indisponível</CardTitle>
								<CardDescription>
									O serviço de diagnóstico não está disponível no ambiente atual.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">{diagnosisError}</p>
					</CardContent>
				</Card>
			) : !latest ? (
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
								<Brain className="h-5 w-5 text-indigo-500" />
							</div>
							<div>
								<CardTitle className="text-lg font-display">Nenhuma análise realizada</CardTitle>
								<CardDescription>
									Execute uma análise para gerar hipóteses baseadas em evidências a partir da anamnese e exames.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<form action={analyzeAction}>
							<input type="hidden" name="patientId" value={patientId} />
							<Button type="submit">
								<Sparkles className="h-4 w-4 mr-2" />
								Gerar Primeira Análise
							</Button>
						</form>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
								<Brain className="h-5 w-5 text-indigo-500" />
							</div>
							<div className="flex-1">
								<div className="flex items-center gap-2 flex-wrap">
									<CardTitle className="text-lg font-display">Última Análise</CardTitle>
									<Badge variant={STATUS_CONFIG[latest.status].variant} className="gap-1">
										{STATUS_CONFIG[latest.status].icon}
										{STATUS_CONFIG[latest.status].label}
									</Badge>
									<Badge variant="outline">{latest.confidence}% de confiança</Badge>
								</div>
								<CardDescription>
									Criado em{" "}
									{new Date(latest.createdAt).toLocaleString("pt-BR", {
										dateStyle: "long",
										timeStyle: "short",
									})}
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<p className="text-sm font-medium">Resumo</p>
							<p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
								{latest.summary}
							</p>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium">Raciocínio Clínico</p>
							<p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
								{latest.reasoning}
							</p>
						</div>

						<div className="space-y-3">
							<p className="text-sm font-medium">Condições Sugeridas</p>
							<div className="grid gap-3 md:grid-cols-2">
								{latest.suggestedConditions.map((condition, index) => (
									<div key={`${condition.name}-${index}`} className="rounded-lg border p-4 space-y-3">
										<div className="flex items-start justify-between gap-2">
											<p className="font-medium">{condition.name}</p>
											<div className="flex items-center gap-2 shrink-0">
												<Badge variant="outline">{condition.probability}%</Badge>
												<span className={`text-xs font-medium ${SEVERITY_CONFIG[condition.severity]?.color}`}>
													{SEVERITY_CONFIG[condition.severity]?.label}
												</span>
											</div>
										</div>
										{condition.supportingEvidence.length > 0 && (
											<div>
												<p className="text-xs font-medium text-muted-foreground mb-1">Evidências:</p>
												<ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
													{condition.supportingEvidence.map((evidence) => (
														<li key={evidence}>{evidence}</li>
													))}
												</ul>
											</div>
										)}
									</div>
								))}
							</div>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium">Exames Recomendados</p>
							{latest.recommendedExams.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									Nenhuma recomendação de exame adicional.
								</p>
							) : (
								<div className="flex flex-wrap gap-2">
									{latest.recommendedExams.map((examName) => (
										<Badge key={examName} variant="secondary">
											{examName}
										</Badge>
									))}
								</div>
							)}
						</div>

						{latest.status === "draft" && (
							<div className="space-y-4 rounded-lg border border-primary/50 bg-primary/5 p-4">
								<div>
									<p className="font-medium text-sm">Validação Clínica</p>
									<p className="text-xs text-muted-foreground mt-1">
										Revise esta análise e registre suas notas clínicas finais.
									</p>
								</div>
								<form action={reviewAction} className="space-y-3">
									<input type="hidden" name="patientId" value={patientId} />
									<input type="hidden" name="diagnosisId" value={latest.id} />
									<Textarea
										name="clinicalNotes"
										placeholder="Notas de validação clínica..."
										defaultValue={latest.clinicalNotes ?? ""}
									/>
									<Button type="submit">
										<CheckCircle2 className="h-4 w-4 mr-2" />
										Marcar como Revisado
									</Button>
								</form>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
							<History className="h-5 w-5 text-muted-foreground" />
						</div>
						<div>
							<CardTitle className="text-lg font-display">Histórico de Análises</CardTitle>
							<CardDescription>
								Análises de diagnóstico anteriores para este paciente.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{diagnosisError ? (
						<p className="text-sm text-muted-foreground">{diagnosisError}</p>
					) : diagnosisList.items.length === 0 ? (
						<div className="text-center py-8">
							<Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
							<p className="font-medium">Nenhum histórico</p>
							<p className="text-sm text-muted-foreground mt-1">
								Execute a primeira análise para começar.
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{diagnosisList.items.map((diagnosis) => (
								<div
									key={diagnosis.id}
									className="rounded-lg border p-4 flex flex-wrap items-center justify-between gap-3"
								>
									<div className="space-y-1">
										<p className="font-medium text-sm">{diagnosis.summary}</p>
										<p className="text-xs text-muted-foreground">
											{new Date(diagnosis.createdAt).toLocaleString("pt-BR", {
												dateStyle: "long",
												timeStyle: "short",
											})}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Badge variant={STATUS_CONFIG[diagnosis.status].variant} className="gap-1">
											{STATUS_CONFIG[diagnosis.status].icon}
											{STATUS_CONFIG[diagnosis.status].label}
										</Badge>
										<Badge variant="outline">{diagnosis.confidence}%</Badge>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
