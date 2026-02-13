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
import { ArrowLeft, FilePlus2 } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

interface PageProps {
	params: Promise<{ id: string }>;
}

const STATUS_VARIANT: Record<
	PrescriptionStatus,
	"default" | "secondary" | "destructive"
> = {
	draft: "secondary",
	signed: "default",
	cancelled: "destructive",
};

function extractErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return "Unknown error";
}

async function createPrescriptionAction(formData: FormData) {
	"use server";

	const patientId = String(formData.get("patientId") || "");
	if (!patientId) {
		throw new Error("Missing patient id");
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
		throw new Error("Missing required prescription fields");
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
		throw new Error("Missing identifiers");
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
		throw new Error("Missing identifiers");
	}

	await cancelPrescription(prescriptionId, "Cancelled from patient prescription screen.");
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
		<div className="container mx-auto max-w-6xl space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">Prescriptions</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Therapeutic prescriptions for {patient.name}
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href={`/dashboard/patients/${patientId}`}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Patient
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Create Prescription Draft</CardTitle>
					<CardDescription>
						{prescriptionError
							? "Prescription service unavailable in current backend environment."
							: "Generate a new prescription item and link it to a diagnosis if desired."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{prescriptionError ? (
						<p className="text-sm text-muted-foreground">{prescriptionError}</p>
					) : (
						<form action={createPrescriptionAction} className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<input type="hidden" name="patientId" value={patientId} />

						<select
							name="diagnosisId"
							defaultValue=""
							className="border-input bg-background h-9 rounded-md border px-3 text-sm"
						>
							<option value="">No linked diagnosis</option>
							{diagnoses.items.map((diagnosis) => (
								<option key={diagnosis.id} value={diagnosis.id}>
									{diagnosis.summary}
								</option>
							))}
						</select>

						<select
							name="itemType"
							defaultValue="supplement"
							className="border-input bg-background h-9 rounded-md border px-3 text-sm"
							required
						>
							<option value="supplement">Supplement</option>
							<option value="medication">Medication</option>
							<option value="orientation">Orientation</option>
						</select>

						<Input name="itemName" placeholder="Item name" required />
						<Input name="dosage" placeholder="Dosage (e.g. 2000 IU)" required />
						<Input name="frequency" placeholder="Frequency (e.g. 1x/day)" required />
						<Input name="duration" placeholder="Duration (e.g. 60 days)" required />
						<Input
							name="validUntil"
							type="date"
							placeholder="Valid until"
						/>

						<Textarea
							name="instructions"
							placeholder="Item instructions (optional)"
							className="md:col-span-2"
						/>
						<Textarea
							name="notes"
							placeholder="General prescription notes (optional)"
							className="md:col-span-2"
						/>

						<div className="md:col-span-2">
							<Button type="submit">
								<FilePlus2 className="h-4 w-4 mr-2" />
								Create Draft
							</Button>
						</div>
						</form>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Prescription History</CardTitle>
					<CardDescription>Total prescriptions: {prescriptions.total}</CardDescription>
				</CardHeader>
				<CardContent>
					{prescriptionError ? (
						<p className="text-sm text-muted-foreground">{prescriptionError}</p>
					) : prescriptions.items.length === 0 ? (
						<p className="text-sm text-muted-foreground">No prescriptions created yet.</p>
					) : (
						<div className="space-y-3">
							{prescriptions.items.map((prescription) => (
								<div key={prescription.id} className="rounded-md border p-4 space-y-3">
									<div className="flex items-center justify-between gap-2 flex-wrap">
										<div>
											<p className="text-sm font-medium">
												{prescription.items[0]?.name || "Prescription"}
											</p>
											<p className="text-xs text-muted-foreground">
												Created on{" "}
												{new Date(prescription.createdAt).toLocaleString("en-US")}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<Badge variant={STATUS_VARIANT[prescription.status]}>
												{prescription.status}
											</Badge>
											<Badge variant="outline">
												{prescription.items.length} item(s)
											</Badge>
										</div>
									</div>

									<div className="space-y-1 text-sm">
										{prescription.items.map((item) => (
											<div key={item.id}>
												<span className="font-medium">{item.name}</span>{" "}
												- {item.dosage} - {item.frequency} - {item.duration}
											</div>
										))}
									</div>

									{prescription.notes && (
										<p className="text-sm text-muted-foreground">{prescription.notes}</p>
									)}

									{prescription.status === "draft" && (
										<div className="flex gap-2">
											<form action={signPrescriptionAction}>
												<input type="hidden" name="patientId" value={patientId} />
												<input
													type="hidden"
													name="prescriptionId"
													value={prescription.id}
												/>
												<Button type="submit" size="sm">
													Mark as Signed
												</Button>
											</form>

											<form action={cancelPrescriptionAction}>
												<input type="hidden" name="patientId" value={patientId} />
												<input
													type="hidden"
													name="prescriptionId"
													value={prescription.id}
												/>
												<Button type="submit" variant="destructive" size="sm">
													Cancel
												</Button>
											</form>
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
