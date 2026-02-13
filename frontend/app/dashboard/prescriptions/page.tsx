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
import { listPatients, type ListPatientsResponse } from "@/lib/api/patients-server";
import {
	listPrescriptions,
	type ListPrescriptionsResponse,
	type PrescriptionStatus,
} from "@/lib/api/prescription-server";
import Link from "next/link";
import { Pill, AlertTriangle, FileEdit, CheckCircle2, XCircle } from "lucide-react";

const STATUS_LABEL: Record<PrescriptionStatus, string> = {
	draft: "Rascunho",
	signed: "Assinada",
	cancelled: "Cancelada",
};

const STATUS_VARIANT: Record<PrescriptionStatus, "default" | "secondary" | "destructive"> = {
	draft: "secondary",
	signed: "default",
	cancelled: "destructive",
};

const STATUS_ICONS: Record<PrescriptionStatus, React.ReactNode> = {
	draft: <FileEdit className="h-3 w-3" />,
	signed: <CheckCircle2 className="h-3 w-3" />,
	cancelled: <XCircle className="h-3 w-3" />,
};

function extractErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return "Erro desconhecido";
}

export default async function PrescriptionsPage() {
	let prescriptionError: string | undefined;
	let prescriptions: ListPrescriptionsResponse = { items: [], total: 0 };
	let patients: ListPatientsResponse = { items: [], total: 0 };

	try {
		[prescriptions, patients] = await Promise.all([
			listPrescriptions({ limit: 100, offset: 0 }),
			listPatients({ limit: 300, offset: 0 }),
		]);
	} catch (error) {
		prescriptionError = extractErrorMessage(error);
	}

	const patientNameById = new Map(
		patients.items.map((patient) => [patient.id, patient.name]),
	);

	return (
		<div className="space-y-6 animate-fade-in">
			<div>
				<h1 className="text-2xl font-display font-bold">Prescrições</h1>
				<p className="text-muted-foreground mt-1">
					Gerencie receitas e prescrições terapêuticas dos pacientes.
				</p>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
							<Pill className="h-5 w-5 text-success" />
						</div>
						<div>
							<CardTitle className="text-lg font-display">Registro de Prescrições</CardTitle>
							<CardDescription>
								{prescriptionError
									? "Serviço de prescrições indisponível no ambiente atual."
									: `${prescriptions.total} prescrição${prescriptions.total !== 1 ? "ões" : ""} registrada${prescriptions.total !== 1 ? "s" : ""}`}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{prescriptionError ? (
						<div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-lg">
							<AlertTriangle className="h-5 w-5 shrink-0" />
							<div>
								<p className="font-medium">Erro ao carregar prescrições</p>
								<p className="text-sm opacity-80">{prescriptionError}</p>
							</div>
						</div>
					) : prescriptions.items.length === 0 ? (
						<div className="text-center py-12">
							<Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
							<p className="font-medium">Nenhuma prescrição registrada</p>
							<p className="text-muted-foreground text-sm mt-1">
								As prescrições são criadas a partir do prontuário de cada paciente.
							</p>
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Paciente</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Itens</TableHead>
										<TableHead>Criado em</TableHead>
										<TableHead className="text-right">Ações</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{prescriptions.items.map((prescription) => (
										<TableRow key={prescription.id}>
											<TableCell>
												<Link
													href={`/dashboard/patients/${prescription.patientId}`}
													className="text-primary hover:underline font-medium"
												>
													{patientNameById.get(prescription.patientId) ?? "Paciente"}
												</Link>
											</TableCell>
											<TableCell>
												<Badge variant={STATUS_VARIANT[prescription.status]} className="gap-1">
													{STATUS_ICONS[prescription.status]}
													{STATUS_LABEL[prescription.status]}
												</Badge>
											</TableCell>
											<TableCell>
												<span className="text-muted-foreground">
													{prescription.items.length} item{prescription.items.length !== 1 ? "s" : ""}
												</span>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{new Date(prescription.createdAt).toLocaleDateString("pt-BR")}
											</TableCell>
											<TableCell className="text-right">
												<Button asChild variant="outline" size="sm">
													<Link href={`/dashboard/patients/${prescription.patientId}/prescriptions`}>
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
