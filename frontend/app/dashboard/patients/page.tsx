import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	createPatient,
	listPatients,
	type PatientGender,
	type PatientStatus,
} from "@/lib/api/patients-server";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface PageProps {
	searchParams: Promise<{
		search?: string | string[];
		status?: string | string[];
	}>;
}

function readSearchParam(value?: string | string[]): string | undefined {
	if (!value) {
		return undefined;
	}
	return Array.isArray(value) ? value[0] : value;
}

function parseStatus(value?: string): PatientStatus | undefined {
	if (value === "active" || value === "inactive" || value === "archived") {
		return value;
	}
	return undefined;
}

async function createPatientAction(formData: FormData) {
	"use server";

	const { orgId } = await auth();
	if (!orgId) {
		redirect("/select-organization");
	}

	const gender = formData.get("gender");
	if (gender !== "male" && gender !== "female" && gender !== "other") {
		throw new Error("Invalid gender");
	}

	await createPatient({
		name: String(formData.get("name") || "").trim(),
		cpf: String(formData.get("cpf") || "").trim(),
		email: String(formData.get("email") || "").trim() || undefined,
		phone: String(formData.get("phone") || "").trim(),
		birthDate: String(formData.get("birthDate") || "").trim(),
		gender: gender as PatientGender,
	});

	revalidatePath("/dashboard/patients");
	redirect("/dashboard/patients");
}

export default async function PatientsPage({ searchParams }: PageProps) {
	const { orgId } = await auth();
	if (!orgId) {
		redirect("/select-organization");
	}

	const resolvedSearchParams = await searchParams;
	const search = readSearchParam(resolvedSearchParams.search) ?? "";
	const statusFilter = parseStatus(readSearchParam(resolvedSearchParams.status));

	let patients;
	try {
		patients = await listPatients({
			search: search || undefined,
			status: statusFilter,
			limit: 50,
			offset: 0,
		});
	} catch (error) {
		if (error instanceof Error && error.message.includes("missing auth context")) {
			redirect("/select-organization");
		}
		throw error;
	}

	return (
		<div className="container mx-auto max-w-6xl space-y-6">
			<div>
				<h1 className="text-3xl font-semibold">Patients</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Patient records and clinical data management.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Register New Patient</CardTitle>
					<CardDescription>
						This registration will be available for anamnesis and exam workflows.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={createPatientAction} className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
						<Input name="name" placeholder="Full name" required />
						<Input name="cpf" placeholder="CPF" required />
						<Input name="email" placeholder="Email (optional)" type="email" />
						<Input name="phone" placeholder="Phone" required />
						<Input name="birthDate" type="date" required />
						<select
							name="gender"
							defaultValue="female"
							className="border-input bg-background h-9 rounded-md border px-3 text-sm"
							required
						>
							<option value="female">Female</option>
							<option value="male">Male</option>
							<option value="other">Other</option>
						</select>

						<div className="md:col-span-2 lg:col-span-3">
							<Button type="submit">Create Patient</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Patient List</CardTitle>
					<CardDescription>Total: {patients.total}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<form method="GET" className="flex flex-col gap-3 md:flex-row md:items-center">
						<Input
							name="search"
							defaultValue={search}
							placeholder="Search by name or CPF"
							className="md:max-w-sm"
						/>
						<select
							name="status"
							defaultValue={statusFilter ?? "all"}
							className="border-input bg-background h-9 rounded-md border px-3 text-sm md:w-48"
						>
							<option value="all">All statuses</option>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
							<option value="archived">Archived</option>
						</select>
						<Button type="submit" variant="outline">
							Filter
						</Button>
						{(search || statusFilter) && (
							<Button asChild variant="ghost">
								<Link href="/dashboard/patients">Clear</Link>
							</Button>
						)}
					</form>

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Patient</TableHead>
								<TableHead>CPF</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Created at</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{patients.items.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="text-muted-foreground">
										No patients found.
									</TableCell>
								</TableRow>
							) : (
								patients.items.map((patient) => (
									<TableRow key={patient.id}>
										<TableCell>
											<div className="font-medium">{patient.name}</div>
											{patient.email && (
												<div className="text-muted-foreground text-xs">
													{patient.email}
												</div>
											)}
										</TableCell>
										<TableCell>{patient.cpf}</TableCell>
										<TableCell>{patient.status}</TableCell>
										<TableCell>
											{new Date(patient.createdAt).toLocaleDateString("en-US")}
										</TableCell>
										<TableCell className="text-right">
											<Button asChild size="sm" variant="outline">
												<Link href={`/dashboard/patients/${patient.id}`}>
													View Record
												</Link>
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
