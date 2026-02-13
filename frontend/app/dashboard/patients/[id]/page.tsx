import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientTimeline } from "@/components/timeline/patient-timeline";
import {
	archivePatient,
	getPatient,
	getTimeline,
	type PatientGender,
	type PatientStatus,
	updatePatient,
} from "@/lib/api/patients-server";
import { getPatientExams } from "@/lib/api/exams-server";
import { listDiagnoses } from "@/lib/api/diagnosis-server";
import { listPrescriptions } from "@/lib/api/prescription-server";
import { getPatientSubmissions } from "@/lib/api/anamnesis-server";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
	AlertTriangle,
	Archive,
	ArrowLeft,
	Brain,
	Calendar,
	ClipboardList,
	FileSearch,
	Mail,
	Phone,
	Pill,
	Plus,
	Save,
	User,
	History,
} from "lucide-react";

interface PageProps {
	params: Promise<{ id: string }>;
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

const genderLabels: Record<PatientGender, string> = {
	male: "Masculino",
	female: "Feminino",
	other: "Outro",
};

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

function calculateAge(birthDate: string): number {
	const today = new Date();
	const birth = new Date(birthDate);
	let age = today.getFullYear() - birth.getFullYear();
	const monthDiff = today.getMonth() - birth.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
		age--;
	}
	return age;
}

async function updatePatientAction(formData: FormData) {
	"use server";

	const id = String(formData.get("id") || "");
	if (!id) {
		throw new Error("ID do paciente não informado");
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
		throw new Error("ID do paciente não informado");
	}

	await archivePatient(id);
	revalidatePath("/dashboard/patients");
	redirect("/dashboard/patients");
}

export default async function PatientDetailsPage({ params }: PageProps) {
	const { id } = await params;

	let patient;
	let timeline;
	let examsCount = 0;
	let diagnosesCount = 0;
	let prescriptionsCount = 0;
	let anamnesisCount = 0;

	try {
		const [patientData, timelineData, exams, diagnoses, prescriptions, anamnesis] = await Promise.all([
			getPatient(id),
			getTimeline({ patientId: id, limit: 30 }),
			getPatientExams(id).catch(() => ({ items: [], total: 0 })),
			listDiagnoses({ patientId: id, limit: 1, offset: 0 }).catch(() => ({ items: [], total: 0 })),
			listPrescriptions({ patientId: id, limit: 1, offset: 0 }).catch(() => ({ items: [], total: 0 })),
			getPatientSubmissions(id).catch(() => ({ items: [], total: 0 })),
		]);

		patient = patientData;
		timeline = timelineData;
		examsCount = exams.total;
		diagnosesCount = diagnoses.total;
		prescriptionsCount = prescriptions.total;
		anamnesisCount = anamnesis.total;
	} catch {
		notFound();
	}

	const age = calculateAge(patient.birthDate);

	const quickStats = [
		{
			label: "Anamneses",
			value: anamnesisCount,
			icon: ClipboardList,
			href: `/dashboard/anamnesis`,
			color: "text-purple-500",
			bgColor: "bg-purple-500/10",
		},
		{
			label: "Exames",
			value: examsCount,
			icon: FileSearch,
			href: `/dashboard/patients/${id}/exams`,
			color: "text-orange-500",
			bgColor: "bg-orange-500/10",
		},
		{
			label: "Diagnósticos",
			value: diagnosesCount,
			icon: Brain,
			href: `/dashboard/patients/${id}/diagnosis`,
			color: "text-indigo-500",
			bgColor: "bg-indigo-500/10",
		},
		{
			label: "Prescrições",
			value: prescriptionsCount,
			icon: Pill,
			href: `/dashboard/patients/${id}/prescriptions`,
			color: "text-pink-500",
			bgColor: "bg-pink-500/10",
		},
	];

	return (
		<div className="space-y-6 animate-fade-in">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
				<div className="flex items-start gap-4">
					<Button asChild variant="ghost" size="icon" className="shrink-0 mt-1">
						<Link href="/dashboard/patients">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-display font-bold">{patient.name}</h1>
							<Badge variant={statusVariants[patient.status]}>
								{statusLabels[patient.status]}
							</Badge>
						</div>
						<p className="text-muted-foreground mt-1">
							{genderLabels[patient.gender]} • {age} anos • CPF: {patient.cpf}
						</p>
					</div>
				</div>
				<div className="flex gap-2 ml-12 sm:ml-0">
					<Button asChild>
						<Link href={`/dashboard/patients/${id}/exams/upload`}>
							<Plus className="h-4 w-4 mr-2" />
							Novo Exame
						</Link>
					</Button>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{quickStats.map((stat) => (
					<Link key={stat.label} href={stat.href}>
						<Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer">
							<CardContent className="p-4">
								<div className="flex items-center gap-3">
									<div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
										<stat.icon className={`h-5 w-5 ${stat.color}`} />
									</div>
									<div>
										<p className="text-2xl font-display font-bold">{stat.value}</p>
										<p className="text-xs text-muted-foreground">{stat.label}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>

			{/* Main Content with Tabs */}
			<Tabs defaultValue="overview" className="space-y-6">
				<TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
					<TabsTrigger value="overview" className="gap-2">
						<User className="h-4 w-4" />
						Dados
					</TabsTrigger>
					<TabsTrigger value="timeline" className="gap-2">
						<History className="h-4 w-4" />
						Histórico
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					{/* Patient Info Card */}
					<Card>
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
									<User className="h-5 w-5 text-primary" />
								</div>
								<div>
									<CardTitle className="text-lg font-display">Dados do Paciente</CardTitle>
									<CardDescription>
										Informações cadastrais e status clínico.
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<form action={updatePatientAction} className="space-y-4">
								<input name="id" type="hidden" defaultValue={patient.id} />

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
									<div className="space-y-2">
										<label htmlFor="name" className="text-sm font-medium">
											Nome completo
										</label>
										<Input id="name" name="name" defaultValue={patient.name} required />
									</div>
									<div className="space-y-2">
										<label htmlFor="cpf" className="text-sm font-medium">
											CPF
										</label>
										<Input id="cpf" name="cpf" defaultValue={patient.cpf} required />
									</div>
									<div className="space-y-2">
										<label htmlFor="email" className="text-sm font-medium">
											E-mail
										</label>
										<div className="relative">
											<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
											<Input
												id="email"
												name="email"
												type="email"
												defaultValue={patient.email ?? ""}
												placeholder="email@exemplo.com"
												className="pl-9"
											/>
										</div>
									</div>
									<div className="space-y-2">
										<label htmlFor="phone" className="text-sm font-medium">
											Telefone
										</label>
										<div className="relative">
											<Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
											<Input
												id="phone"
												name="phone"
												defaultValue={patient.phone}
												required
												className="pl-9"
											/>
										</div>
									</div>
									<div className="space-y-2">
										<label htmlFor="birthDate" className="text-sm font-medium">
											Data de nascimento
										</label>
										<div className="relative">
											<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
											<Input
												id="birthDate"
												name="birthDate"
												type="date"
												defaultValue={patient.birthDate}
												required
												className="pl-9"
											/>
										</div>
									</div>
									<div className="space-y-2">
										<label htmlFor="gender" className="text-sm font-medium">
											Sexo
										</label>
										<select
											id="gender"
											name="gender"
											defaultValue={patient.gender}
											className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
											required
										>
											<option value="female">Feminino</option>
											<option value="male">Masculino</option>
											<option value="other">Outro</option>
										</select>
									</div>
									<div className="space-y-2">
										<label htmlFor="status" className="text-sm font-medium">
											Status
										</label>
										<select
											id="status"
											name="status"
											defaultValue={patient.status}
											className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
											required
										>
											<option value="active">Ativo</option>
											<option value="inactive">Inativo</option>
											<option value="archived">Arquivado</option>
										</select>
									</div>
								</div>

								<div className="flex items-center gap-3 pt-2">
									<Button type="submit">
										<Save className="h-4 w-4 mr-2" />
										Salvar Alterações
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>

					{/* Quick Actions Card */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-display">Ações Rápidas</CardTitle>
							<CardDescription>
								Acesse os módulos clínicos do paciente.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
								<Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
									<Link href={`/dashboard/patients/${patient.id}/exams`}>
										<FileSearch className="h-5 w-5 text-orange-500" />
										<span>Ver Exames</span>
									</Link>
								</Button>
								<Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
									<Link href={`/dashboard/patients/${patient.id}/exams/upload`}>
										<Plus className="h-5 w-5 text-primary" />
										<span>Upload Exame</span>
									</Link>
								</Button>
								<Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
									<Link href={`/dashboard/patients/${patient.id}/diagnosis`}>
										<Brain className="h-5 w-5 text-indigo-500" />
										<span>Diagnóstico</span>
									</Link>
								</Button>
								<Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
									<Link href={`/dashboard/patients/${patient.id}/prescriptions`}>
										<Pill className="h-5 w-5 text-pink-500" />
										<span>Prescrições</span>
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Danger Zone */}
					{patient.status !== "archived" && (
						<Card className="border-destructive/50">
							<CardHeader>
								<div className="flex items-center gap-3">
									<div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
										<AlertTriangle className="h-5 w-5 text-destructive" />
									</div>
									<div>
										<CardTitle className="text-lg font-display">Zona de Risco</CardTitle>
										<CardDescription>
											Ações irreversíveis relacionadas ao prontuário.
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground mb-4">
									Arquivar o paciente remove ele das operações ativas, mas preserva todo o histórico clínico.
								</p>
								<form action={archivePatientAction}>
									<input name="id" type="hidden" defaultValue={patient.id} />
									<Button type="submit" variant="destructive">
										<Archive className="h-4 w-4 mr-2" />
										Arquivar Paciente
									</Button>
								</form>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="timeline">
					<PatientTimeline events={timeline.items} total={timeline.total} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
