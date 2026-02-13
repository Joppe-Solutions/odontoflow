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
import { listExams, type ExamStatus } from "@/lib/api/exams-server";
import { listPatients } from "@/lib/api/patients-server";
import Link from "next/link";
import { FileSearch, AlertCircle, Clock, Loader2, CheckCircle } from "lucide-react";

const STATUS_LABEL: Record<ExamStatus, string> = {
	pending: "Pendente",
	processing: "Processando",
	ready: "Pronto",
	error: "Erro",
};

const STATUS_VARIANT: Record<ExamStatus, "default" | "secondary" | "destructive" | "outline"> = {
	pending: "secondary",
	processing: "default",
	ready: "outline",
	error: "destructive",
};

const STATUS_ICONS: Record<ExamStatus, React.ReactNode> = {
	pending: <Clock className="h-3 w-3" />,
	processing: <Loader2 className="h-3 w-3 animate-spin" />,
	ready: <CheckCircle className="h-3 w-3" />,
	error: <AlertCircle className="h-3 w-3" />,
};

export default async function ExamsPage() {
	const [exams, patients] = await Promise.all([
		listExams({ limit: 100, offset: 0 }),
		listPatients({ limit: 200, offset: 0 }),
	]);

	const patientNameById = new Map(
		patients.items.map((patient) => [patient.id, patient.name]),
	);

	return (
		<div className="space-y-6 animate-fade-in">
			<div>
				<h1 className="text-2xl font-display font-bold">Exames</h1>
				<p className="text-muted-foreground mt-1">
					Visualize todos os exames enviados e seu status de processamento.
				</p>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
							<FileSearch className="h-5 w-5 text-warning" />
						</div>
						<div>
							<CardTitle className="text-lg font-display">Registro de Exames</CardTitle>
							<CardDescription>
								{exams.total} exame{exams.total !== 1 ? "s" : ""} cadastrado{exams.total !== 1 ? "s" : ""}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{exams.items.length === 0 ? (
						<div className="text-center py-12">
							<FileSearch className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
							<p className="font-medium">Nenhum exame encontrado</p>
							<p className="text-muted-foreground text-sm mt-1">
								Os exames são adicionados pelo prontuário de cada paciente.
							</p>
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Exame</TableHead>
										<TableHead>Paciente</TableHead>
										<TableHead>Tipo</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Data</TableHead>
										<TableHead className="text-right">Ações</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{exams.items.map((exam) => (
										<TableRow key={exam.id}>
											<TableCell className="font-medium">{exam.name}</TableCell>
											<TableCell>
												<Link
													href={`/dashboard/patients/${exam.patientId}`}
													className="text-primary hover:underline"
												>
													{patientNameById.get(exam.patientId) ?? "Paciente"}
												</Link>
											</TableCell>
											<TableCell className="text-muted-foreground">{exam.type}</TableCell>
											<TableCell>
												<Badge variant={STATUS_VARIANT[exam.status]} className="gap-1">
													{STATUS_ICONS[exam.status]}
													{STATUS_LABEL[exam.status]}
												</Badge>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{new Date(exam.createdAt).toLocaleDateString("pt-BR")}
											</TableCell>
											<TableCell className="text-right">
												<Button asChild variant="outline" size="sm">
													<Link href={`/dashboard/patients/${exam.patientId}/exams/${exam.id}`}>
														Ver detalhes
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
