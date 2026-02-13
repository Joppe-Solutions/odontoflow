import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	listDiagnoses,
	type ListDiagnosesResponse,
} from "@/lib/api/diagnosis-server";
import { getPatient } from "@/lib/api/patients-server";
import {
	cancelPrescription,
	createPrescription,
	listPrescriptions,
	signPrescription,
	type ListPrescriptionsResponse,
	type PrescriptionItemType,
	type PrescriptionStatus,
} from "@/lib/api/prescription-server";
import { ArrowLeft, FilePlus2, Pill, CheckCircle2, XCircle, FileEdit, AlertTriangle, History } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

interface PageProps {
	params: Promise<{ id: string }>;
}

const STATUS_CONFIG: Record<PrescriptionStatus, { label: string; variant: "default" | "secondary" | "destructive"; icon: React.ReactNode }> = {
	draft: { label: "Rascunho", variant: "secondary", icon: <FileEdit className="h-3 w-3" /> },
	signed: { label: "Assinada", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
	cancelled: { label: "Cancelada", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

const ITEM_TYPE_LABELS: Record<PrescriptionItemType, string> = {
	supplement: "Suplemento",
	medication: "Medicamento",
	orientation: "Orientação",
};

function extractErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return "Erro desconhecido";
}

async function createPrescriptionAction(formData: FormData) {
	"use server";

	const patientId = String(formData.get("patientId") || "");
	if (!patientId) {
		throw new Error("ID do paciente não informado");
	}

	const diagnosisIdValue = String(formData.get("diagnosisId") || "").trim();
	const itemType = String(formData.get("itemType") || "supplement") as PrescriptionItemType;
	const itemName = String(formData.get("itemName") || "").trim();
	const dosage = String(formData.get("dosage") || "").trim();
	const frequency = String(formData.get("frequency") || "").trim();
	const duration = String(formData.get("duration") || "").trim();
	const instructions = String(formData.get("instructions") || "").trim();
	const notes = String(formData.get("notes") || "").trim();
	const validUntil = String(formData.get("validUntil") || "").trim();

	if (!itemName || !dosage || !frequency || !duration) {
		throw new Error("Campos obrigatórios da prescrição não preenchidos");
	}

	await createPrescription({
		patientId,
		diagnosisId: diagnosisIdValue || undefined,
		items: [
			{
				type: itemType,
				name: itemName,
				dosage,
				frequency,
				duration,
				instructions: instructions || undefined,
			},
		],
		notes: notes || undefined,
		validUntil: validUntil || undefined,
	});

	revalidatePath(`/dashboard/patients/${patientId}`);
	revalidatePath(`/dashboard/patients/${patientId}/prescriptions`);
	revalidatePath("/dashboard/prescriptions");
	redirect(`/dashboard/patients/${patientId}/prescriptions`);
}

async function signPrescriptionAction(formData: FormData) {
	"use server";

	const patientId = String(formData.get("patientId") || "");
	const prescriptionId = String(formData.get("prescriptionId") || "");
	if (!patientId || !prescriptionId) {
		throw new Error("Identificadores ausentes");
	}

	await signPrescription(prescriptionId);
	revalidatePath(`/dashboard/patients/${patientId}`);
	revalidatePath(`/dashboard/patients/${patientId}/prescriptions`);
	revalidatePath("/dashboard/prescriptions");
	redirect(`/dashboard/patients/${patientId}/prescriptions`);
}

async function cancelPrescriptionAction(formData: FormData) {
	"use server";

	const patientId = String(formData.get("patientId") || "");
	const prescriptionId = String(formData.get("prescriptionId") || "");
	if (!patientId || !prescriptionId) {
		throw new Error("Identificadores ausentes");
	}

	await cancelPrescription(prescriptionId, "Cancelada pela tela de prescrições do paciente.");
	revalidatePath(`/dashboard/patients/${patientId}`);
	revalidatePath(`/dashboard/patients/${patientId}/prescriptions`);
	revalidatePath("/dashboard/prescriptions");
	redirect(`/dashboard/patients/${patientId}/prescriptions`);
}

export default async function PatientPrescriptionsPage({ params }: PageProps) {
	const { id: patientId } = await params;

	let patient;
	try {
		patient = await getPatient(patientId);
	} catch {
		notFound();
	}

	let prescriptionError: string | undefined;
	let prescriptions: ListPrescriptionsResponse = { items: [], total: 0 };
	let diagnoses: ListDiagnosesResponse = { items: [], total: 0 };
	try {
		[prescriptions, diagnoses] = await Promise.all([
			listPrescriptions({ patientId, limit: 50, offset: 0 }),
			listDiagnoses({ patientId, limit: 30, offset: 0 }),
		]);
	} catch (error) {
		prescriptionError = extractErrorMessage(error);
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
						<h1 className="text-2xl font-display font-bold">Prescrições</h1>
						<p className="text-muted-foreground mt-1">
							Prescrições terapêuticas para {patient.name}
						</p>
					</div>
				</div>
				<Button asChild variant="outline">
					<Link href={`/dashboard/patients/${patientId}/diagnosis`}>
						Ver Diagnóstico
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
							<FilePlus2 className="h-5 w-5 text-pink-500" />
						</div>
						<div>
							<CardTitle className="text-lg font-display">Nova Prescrição</CardTitle>
							<CardDescription>
								{prescriptionError
									? "Serviço de prescrições indisponível no ambiente atual."
									: "Crie um rascunho de prescrição e vincule a um diagnóstico se desejar."}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{prescriptionError ? (
						<div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-lg">
							<AlertTriangle className="h-5 w-5 shrink-0" />
							<p className="text-sm">{prescriptionError}</p>
						</div>
					) : (
						<form action={createPrescriptionAction} className="space-y-4">
							<input type="hidden" name="patientId" value={patientId} />

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<label htmlFor="diagnosisId" className="text-sm font-medium">
										Diagnóstico vinculado (opcional)
									</label>
									<select
										id="diagnosisId"
										name="diagnosisId"
										defaultValue=""
										className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
									>
										<option value="">Nenhum diagnóstico vinculado</option>
										{diagnoses.items.map((diagnosis) => (
											<option key={diagnosis.id} value={diagnosis.id}>
												{diagnosis.summary}
											</option>
										))}
									</select>
								</div>

								<div className="space-y-2">
									<label htmlFor="itemType" className="text-sm font-medium">
										Tipo do item
									</label>
									<select
										id="itemType"
										name="itemType"
										defaultValue="supplement"
										className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
										required
									>
										<option value="supplement">Suplemento</option>
										<option value="medication">Medicamento</option>
										<option value="orientation">Orientação</option>
									</select>
								</div>

								<div className="space-y-2">
									<label htmlFor="itemName" className="text-sm font-medium">
										Nome do item
									</label>
									<Input id="itemName" name="itemName" placeholder="Ex: Vitamina D3" required />
								</div>

								<div className="space-y-2">
									<label htmlFor="dosage" className="text-sm font-medium">
										Dosagem
									</label>
									<Input id="dosage" name="dosage" placeholder="Ex: 2000 UI" required />
								</div>

								<div className="space-y-2">
									<label htmlFor="frequency" className="text-sm font-medium">
										Frequência
									</label>
									<Input id="frequency" name="frequency" placeholder="Ex: 1x ao dia" required />
								</div>

								<div className="space-y-2">
									<label htmlFor="duration" className="text-sm font-medium">
										Duração
									</label>
									<Input id="duration" name="duration" placeholder="Ex: 60 dias" required />
								</div>

								<div className="space-y-2">
									<label htmlFor="validUntil" className="text-sm font-medium">
										Válido até (opcional)
									</label>
									<Input id="validUntil" name="validUntil" type="date" />
								</div>
							</div>

							<div className="space-y-2">
								<label htmlFor="instructions" className="text-sm font-medium">
									Instruções do item (opcional)
								</label>
								<Textarea
									id="instructions"
									name="instructions"
									placeholder="Ex: Tomar com uma refeição gordurosa para melhor absorção"
								/>
							</div>

							<div className="space-y-2">
								<label htmlFor="notes" className="text-sm font-medium">
									Observações gerais (opcional)
								</label>
								<Textarea
									id="notes"
									name="notes"
									placeholder="Notas adicionais sobre a prescrição"
								/>
							</div>

							<Button type="submit">
								<FilePlus2 className="h-4 w-4 mr-2" />
								Criar Rascunho
							</Button>
						</form>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
							<History className="h-5 w-5 text-muted-foreground" />
						</div>
						<div>
							<CardTitle className="text-lg font-display">Histórico de Prescrições</CardTitle>
							<CardDescription>
								{prescriptions.total} prescrição{prescriptions.total !== 1 ? "ões" : ""} registrada{prescriptions.total !== 1 ? "s" : ""}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{prescriptionError ? (
						<div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-lg">
							<AlertTriangle className="h-5 w-5 shrink-0" />
							<p className="text-sm">{prescriptionError}</p>
						</div>
					) : prescriptions.items.length === 0 ? (
						<div className="text-center py-12">
							<Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
							<p className="font-medium">Nenhuma prescrição criada</p>
							<p className="text-sm text-muted-foreground mt-1">
								Crie a primeira prescrição para este paciente.
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{prescriptions.items.map((prescription) => {
								const statusConfig = STATUS_CONFIG[prescription.status];
								return (
									<div key={prescription.id} className="rounded-lg border p-4 space-y-4">
										<div className="flex items-start justify-between gap-3 flex-wrap">
											<div>
												<p className="font-medium">
													{prescription.items[0]?.name || "Prescrição"}
												</p>
												<p className="text-xs text-muted-foreground mt-1">
													Criado em{" "}
													{new Date(prescription.createdAt).toLocaleString("pt-BR", {
														dateStyle: "long",
														timeStyle: "short",
													})}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<Badge variant={statusConfig.variant} className="gap-1">
													{statusConfig.icon}
													{statusConfig.label}
												</Badge>
												<Badge variant="outline">
													{prescription.items.length} item{prescription.items.length !== 1 ? "s" : ""}
												</Badge>
											</div>
										</div>

										<div className="space-y-2">
											{prescription.items.map((item) => (
												<div key={item.id} className="p-3 bg-muted/50 rounded-lg">
													<div className="flex items-center gap-2 flex-wrap">
														<Badge variant="secondary" className="text-xs">
															{ITEM_TYPE_LABELS[item.type]}
														</Badge>
														<span className="font-medium text-sm">{item.name}</span>
													</div>
													<p className="text-sm text-muted-foreground mt-1">
														{item.dosage} - {item.frequency} - {item.duration}
													</p>
													{item.instructions && (
														<p className="text-xs text-muted-foreground mt-1">
															{item.instructions}
														</p>
													)}
												</div>
											))}
										</div>

										{prescription.notes && (
											<p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
												{prescription.notes}
											</p>
										)}

										{prescription.status === "draft" && (
											<div className="flex gap-2 pt-2">
												<form action={signPrescriptionAction}>
													<input type="hidden" name="patientId" value={patientId} />
													<input type="hidden" name="prescriptionId" value={prescription.id} />
													<Button type="submit" size="sm">
														<CheckCircle2 className="h-4 w-4 mr-2" />
														Assinar
													</Button>
												</form>

												<form action={cancelPrescriptionAction}>
													<input type="hidden" name="patientId" value={patientId} />
													<input type="hidden" name="prescriptionId" value={prescription.id} />
													<Button type="submit" variant="destructive" size="sm">
														<XCircle className="h-4 w-4 mr-2" />
														Cancelar
													</Button>
												</form>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
