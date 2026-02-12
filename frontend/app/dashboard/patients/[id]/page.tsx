import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PatientTimeline } from "@/components/timeline/patient-timeline";
import { archivePatient, getPatient, getTimeline, type PatientGender, type PatientStatus, updatePatient } from "@/lib/api/patients-server";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

interface PageProps {
	params: Promise<{ id: string }>;
}

function toStatus(value: string | null): PatientStatus | undefined {
	if (value === "active" || value === "inactive" || value === "archived") {
		return value;
	}
	return undefined;
}

function toGender(value: string | null): PatientGender | undefined {
	if (value === "male" || value === "female" || value === "other") {
		return value;
	}
	return undefined;
}

async function updatePatientAction(formData: FormData) {
	"use server";

	const id = String(formData.get("id") || "");
	if (!id) {
		throw new Error("Missing patient id");
	}

	await updatePatient({
		id,
		name: String(formData.get("name") || "").trim() || undefined,
		cpf: String(formData.get("cpf") || "").trim() || undefined,
		email: String(formData.get("email") || "").trim() || undefined,
		phone: String(formData.get("phone") || "").trim() || undefined,
		birthDate: String(formData.get("birthDate") || "").trim() || undefined,
		gender: toGender(String(formData.get("gender") || "")),
		status: toStatus(String(formData.get("status") || "")),
	});

	revalidatePath("/dashboard/patients");
	revalidatePath(`/dashboard/patients/${id}`);
	redirect(`/dashboard/patients/${id}`);
}

async function archivePatientAction(formData: FormData) {
	"use server";

	const id = String(formData.get("id") || "");
	if (!id) {
		throw new Error("Missing patient id");
	}

	await archivePatient(id);
	revalidatePath("/dashboard/patients");
	redirect("/dashboard/patients");
}

export default async function PatientDetailsPage({ params }: PageProps) {
	const { id } = await params;

	let patient;
	let timeline;
	try {
		[patient, timeline] = await Promise.all([
			getPatient(id),
			getTimeline({ patientId: id, limit: 20 }),
		]);
	} catch {
		notFound();
	}

	return (
		<div className="container mx-auto max-w-4xl space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">Patient Record</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						ID: {patient.id}
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href="/dashboard/patients">Back</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{patient.name}</CardTitle>
					<CardDescription>
						Update patient registration data and clinical status.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={updatePatientAction} className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<input name="id" type="hidden" defaultValue={patient.id} />

						<Input name="name" defaultValue={patient.name} required />
						<Input name="cpf" defaultValue={patient.cpf} required />
						<Input
							name="email"
							type="email"
							defaultValue={patient.email ?? ""}
							placeholder="Email"
						/>
						<Input name="phone" defaultValue={patient.phone} required />
						<Input name="birthDate" type="date" defaultValue={patient.birthDate} required />

						<select
							name="gender"
							defaultValue={patient.gender}
							className="border-input bg-background h-9 rounded-md border px-3 text-sm"
							required
						>
							<option value="female">Female</option>
							<option value="male">Male</option>
							<option value="other">Other</option>
						</select>

						<select
							name="status"
							defaultValue={patient.status}
							className="border-input bg-background h-9 rounded-md border px-3 text-sm"
							required
						>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
							<option value="archived">Archived</option>
						</select>

						<div className="md:col-span-2 flex items-center gap-2">
							<Button type="submit">Save Changes</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Quick Actions</CardTitle>
					<CardDescription>
						Access patient-related modules and features.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-3">
					<Button asChild variant="outline">
						<Link href={`/dashboard/patients/${patient.id}/exams`}>
							View Exams
						</Link>
					</Button>
					<Button asChild variant="outline">
						<Link href={`/dashboard/patients/${patient.id}/exams/upload`}>
							Upload Exam
						</Link>
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Record Actions</CardTitle>
					<CardDescription>
						Archiving removes the patient from active operations while preserving history.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={archivePatientAction}>
						<input name="id" type="hidden" defaultValue={patient.id} />
						<Button type="submit" variant="destructive">
							Archive Patient
						</Button>
					</form>
				</CardContent>
			</Card>

			<PatientTimeline events={timeline.items} total={timeline.total} />
		</div>
	);
}
