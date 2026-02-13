import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getPatient } from "@/lib/api/patients-server";
import { getPatientExams, type ExamStatus } from "@/lib/api/exams-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, FileSearch, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface PageProps {
	params: Promise<{ id: string }>;
}

const STATUS_CONFIG: Record<
	ExamStatus,
	{ label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
	pending: { label: "Pendente", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
	processing: { label: "Processando", variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
	ready: { label: "Pronto", variant: "outline", icon: <CheckCircle className="h-3 w-3" /> },
	error: { label: "Erro", variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
};

const TYPE_LABELS: Record<string, string> = {
	blood_test: "Hemograma",
	urine_test: "Urina",
	imaging: "Imagem",
	ecg: "ECG",
	ultrasound: "Ultrassom",
	biopsy: "Biópsia",
	other: "Outro",
};

export default async function PatientExamsPage({ params }: PageProps) {
	const { id: patientId } = await params;

	let patient;
	let exams;
	try {
		[patient, exams] = await Promise.all([
			getPatient(patientId),
			getPatientExams(patientId),
		]);
	} catch {
		notFound();
	}

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
						<h1 className="text-2xl font-display font-bold">Exames</h1>
						<p className="text-muted-foreground mt-1">
							{patient.name} - {exams.total} exame{exams.total !== 1 ? "s" : ""}
						</p>
					</div>
				</div>
				<Button asChild>
					<Link href={`/dashboard/patients/${patientId}/exams/upload`}>
						<Plus className="h-4 w-4 mr-2" />
						Enviar Exame
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
							<FileSearch className="h-5 w-5 text-orange-500" />
						</div>
						<div>
							<CardTitle className="text-lg font-display">Histórico de Exames</CardTitle>
							<CardDescription>
								Visualize e gerencie os resultados dos exames do paciente.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{exams.items.length === 0 ? (
						<div className="text-center py-12">
							<FileSearch className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
							<p className="font-medium">Nenhum exame enviado ainda</p>
							<p className="text-muted-foreground text-sm mt-1">
								Envie o primeiro exame do paciente para começar a análise.
							</p>
							<Button asChild className="mt-6">
								<Link href={`/dashboard/patients/${patientId}/exams/upload`}>
									<Plus className="h-4 w-4 mr-2" />
									Enviar primeiro exame
								</Link>
							</Button>
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Exame</TableHead>
										<TableHead>Tipo</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Data</TableHead>
										<TableHead className="text-right">Ações</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{exams.items.map((exam) => {
										const statusConfig = STATUS_CONFIG[exam.status];
										return (
											<TableRow key={exam.id}>
												<TableCell>
													<div className="font-medium">{exam.name}</div>
													{exam.fileName && (
														<div className="text-muted-foreground text-xs">
															{exam.fileName}
														</div>
													)}
												</TableCell>
												<TableCell>
													<Badge variant="outline">
														{TYPE_LABELS[exam.type] || exam.type}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge variant={statusConfig.variant} className="gap-1">
														{statusConfig.icon}
														{statusConfig.label}
													</Badge>
												</TableCell>
												<TableCell className="text-muted-foreground">
													{new Date(exam.createdAt).toLocaleDateString("pt-BR")}
												</TableCell>
												<TableCell className="text-right">
													<Button asChild size="sm" variant="outline">
														<Link href={`/dashboard/patients/${patientId}/exams/${exam.id}`}>
															Ver detalhes
														</Link>
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
