import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Plus, Search, UserPlus } from "lucide-react";

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

const statusLabels: Record<PatientStatus, string> = {
	active: "Ativo",
	inactive: "Inativo",
	archived: "Arquivado",
};

const statusVariants: Record<PatientStatus, "default" | "secondary" | "outline"> = {
	active: "default",
	inactive: "secondary",
	archived: "outline",
};

async function createPatientAction(formData: FormData) {
	"use server";

	const gender = formData.get("gender");
	if (gender !== "male" && gender !== "female" && gender !== "other") {
		throw new Error("Gênero inválido");
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
	const resolvedSearchParams = await searchParams;
	const search = readSearchParam(resolvedSearchParams.search) ?? "";
	const statusFilter = parseStatus(readSearchParam(resolvedSearchParams.status));

	const patients = await listPatients({
		search: search || undefined,
		status: statusFilter,
		limit: 50,
		offset: 0,
	});

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-display font-bold">Pacientes</h1>
					<p className="text-muted-foreground mt-1">
						Gerencie os prontuários e dados clínicos dos seus pacientes.
					</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
							<UserPlus className="h-5 w-5 text-primary" />
						</div>
						<div>
							<CardTitle className="text-lg font-display">Cadastrar Paciente</CardTitle>
							<CardDescription>
								O paciente ficará disponível para anamnese, exames e prescrições.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<form action={createPatientAction} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						<div className="space-y-2">
							<label htmlFor="name" className="text-sm font-medium">
								Nome completo
							</label>
							<Input id="name" name="name" placeholder="Ex: Maria da Silva" required />
						</div>
						<div className="space-y-2">
							<label htmlFor="cpf" className="text-sm font-medium">
								CPF
							</label>
							<Input id="cpf" name="cpf" placeholder="000.000.000-00" required />
						</div>
						<div className="space-y-2">
							<label htmlFor="email" className="text-sm font-medium">
								E-mail (opcional)
							</label>
							<Input id="email" name="email" placeholder="email@exemplo.com" type="email" />
						</div>
						<div className="space-y-2">
							<label htmlFor="phone" className="text-sm font-medium">
								Telefone
							</label>
							<Input id="phone" name="phone" placeholder="(00) 00000-0000" required />
						</div>
						<div className="space-y-2">
							<label htmlFor="birthDate" className="text-sm font-medium">
								Data de nascimento
							</label>
							<Input id="birthDate" name="birthDate" type="date" required />
						</div>
						<div className="space-y-2">
							<label htmlFor="gender" className="text-sm font-medium">
								Sexo
							</label>
							<select
								id="gender"
								name="gender"
								defaultValue="female"
								className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								required
							>
								<option value="female">Feminino</option>
								<option value="male">Masculino</option>
								<option value="other">Outro</option>
							</select>
						</div>

						<div className="md:col-span-2 lg:col-span-3 pt-2">
							<Button type="submit">
								<Plus className="h-4 w-4 mr-2" />
								Cadastrar Paciente
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<CardTitle className="text-lg font-display">Lista de Pacientes</CardTitle>
							<CardDescription>
								{patients.total} paciente{patients.total !== 1 ? "s" : ""} cadastrado{patients.total !== 1 ? "s" : ""}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<form method="GET" className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								name="search"
								defaultValue={search}
								placeholder="Buscar por nome ou CPF"
								className="pl-9"
							/>
						</div>
						<select
							name="status"
							defaultValue={statusFilter ?? "all"}
							className="flex h-9 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<option value="all">Todos os status</option>
							<option value="active">Ativos</option>
							<option value="inactive">Inativos</option>
							<option value="archived">Arquivados</option>
						</select>
						<Button type="submit" variant="secondary">
							Filtrar
						</Button>
						{(search || statusFilter) && (
							<Button asChild variant="ghost">
								<Link href="/dashboard/patients">Limpar</Link>
							</Button>
						)}
					</form>

					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Paciente</TableHead>
									<TableHead>CPF</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Cadastro</TableHead>
									<TableHead className="text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{patients.items.length === 0 ? (
									<TableRow>
										<TableCell colSpan={5} className="h-24 text-center">
											<div className="flex flex-col items-center justify-center text-muted-foreground">
												<Search className="h-8 w-8 mb-2 opacity-50" />
												<p>Nenhum paciente encontrado.</p>
												{(search || statusFilter) && (
													<p className="text-sm">Tente ajustar os filtros de busca.</p>
												)}
											</div>
										</TableCell>
									</TableRow>
								) : (
									patients.items.map((patient) => (
										<TableRow key={patient.id}>
											<TableCell>
												<div>
													<div className="font-medium">{patient.name}</div>
													{patient.email && (
														<div className="text-muted-foreground text-xs">
															{patient.email}
														</div>
													)}
												</div>
											</TableCell>
											<TableCell className="font-mono text-sm">{patient.cpf}</TableCell>
											<TableCell>
												<Badge variant={statusVariants[patient.status as PatientStatus]}>
													{statusLabels[patient.status as PatientStatus] ?? patient.status}
												</Badge>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{new Date(patient.createdAt).toLocaleDateString("pt-BR")}
											</TableCell>
											<TableCell className="text-right">
												<Button asChild size="sm" variant="outline">
													<Link href={`/dashboard/patients/${patient.id}`}>
														Ver prontuário
													</Link>
												</Button>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
