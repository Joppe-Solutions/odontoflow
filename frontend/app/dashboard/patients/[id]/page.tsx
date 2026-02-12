import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { archivePatient, getPatient, type PatientGender, type PatientStatus, updatePatient } from "@/lib/api/patients-server";
import { auth } from "@clerk/nextjs/server";
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

	const { orgId } = await auth();
	if (!orgId) {
		redirect("/select-organization");
	}

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

	const { orgId } = await auth();
	if (!orgId) {
		redirect("/select-organization");
	}

	const id = String(formData.get("id") || "");
	if (!id) {
		throw new Error("Missing patient id");
	}

	await archivePatient(id);
	revalidatePath("/dashboard/patients");
	redirect("/dashboard/patients");
}

export default async function PatientDetailsPage({ params }: PageProps) {
	const { orgId } = await auth();
	if (!orgId) {
		redirect("/select-organization");
	}

	const { id } = await params;

	let patient;
	try {
		patient = await getPatient(id);
	} catch (error) {
		if (error instanceof Error && error.message.includes("missing auth context")) {
			redirect("/select-organization");
		}
		notFound();
	}

	return (
		<div className="container mx-auto max-w-4xl space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">Prontuario do paciente</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						ID: {patient.id}
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href="/dashboard/patients">Voltar</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{patient.name}</CardTitle>
					<CardDescription>
						Atualize os dados cadastrais e status clinico do paciente.
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
							placeholder="E-mail"
						/>
						<Input name="phone" defaultValue={patient.phone} required />
						<Input name="birthDate" type="date" defaultValue={patient.birthDate} required />

						<select
							name="gender"
							defaultValue={patient.gender}
							className="border-input bg-background h-9 rounded-md border px-3 text-sm"
							required
						>
							<option value="female">Feminino</option>
							<option value="male">Masculino</option>
							<option value="other">Outro</option>
						</select>

						<select
							name="status"
							defaultValue={patient.status}
							className="border-input bg-background h-9 rounded-md border px-3 text-sm"
							required
						>
							<option value="active">Ativo</option>
							<option value="inactive">Inativo</option>
							<option value="archived">Arquivado</option>
						</select>

						<div className="md:col-span-2 flex items-center gap-2">
							<Button type="submit">Salvar alteracoes</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Acoes de prontuario</CardTitle>
					<CardDescription>
						Arquivar remove o paciente das operacoes ativas, mantendo historico.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={archivePatientAction}>
						<input name="id" type="hidden" defaultValue={patient.id} />
						<Button type="submit" variant="destructive">
							Arquivar paciente
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
