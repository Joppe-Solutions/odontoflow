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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listTemplates, listSubmissions, type SubmissionStatus } from "@/lib/api/anamnesis-server";
import Link from "next/link";
import { ClipboardList, Plus, FileText, Clock, CheckCircle, XCircle, Send } from "lucide-react";

const STATUS_BADGES: Record<SubmissionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
	pending: { label: "Pendente", variant: "secondary" },
	in_progress: { label: "Em progresso", variant: "default" },
	completed: { label: "Concluído", variant: "outline" },
	expired: { label: "Expirado", variant: "destructive" },
};

const STATUS_ICONS: Record<SubmissionStatus, React.ReactNode> = {
	pending: <Clock className="h-3 w-3" />,
	in_progress: <FileText className="h-3 w-3" />,
	completed: <CheckCircle className="h-3 w-3" />,
	expired: <XCircle className="h-3 w-3" />,
};

export default async function AnamnesisPage() {
	const [templates, submissions] = await Promise.all([
		listTemplates({ limit: 50 }),
		listSubmissions({ limit: 50 }),
	]);

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-display font-bold">Anamneses</h1>
					<p className="text-muted-foreground mt-1">
						Crie e gerencie formulários de histórico de saúde dos pacientes.
					</p>
				</div>
				<Button asChild>
					<Link href="/dashboard/anamnesis/templates/new">
						<Plus className="h-4 w-4 mr-2" />
						Novo Modelo
					</Link>
				</Button>
			</div>

			<Tabs defaultValue="templates">
				<TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
					<TabsTrigger value="templates" className="gap-2">
						<ClipboardList className="h-4 w-4" />
						Modelos ({templates.total})
					</TabsTrigger>
					<TabsTrigger value="submissions" className="gap-2">
						<Send className="h-4 w-4" />
						Envios ({submissions.total})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="templates" className="mt-6">
					<Card>
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
									<ClipboardList className="h-5 w-5 text-primary" />
								</div>
								<div>
									<CardTitle className="text-lg font-display">Modelos de Anamnese</CardTitle>
									<CardDescription>
										Formulários reutilizáveis que podem ser enviados aos pacientes.
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{templates.items.length === 0 ? (
								<div className="text-center py-12">
									<ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
									<p className="font-medium">Nenhum modelo criado ainda</p>
									<p className="text-muted-foreground text-sm mt-1">
										Crie um modelo de anamnese para começar a coletar informações dos pacientes.
									</p>
									<Button asChild className="mt-6">
										<Link href="/dashboard/anamnesis/templates/new">
											<Plus className="h-4 w-4 mr-2" />
											Criar primeiro modelo
										</Link>
									</Button>
								</div>
							) : (
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Nome</TableHead>
												<TableHead>Seções</TableHead>
												<TableHead>Status</TableHead>
												<TableHead>Criado em</TableHead>
												<TableHead className="text-right">Ações</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{templates.items.map((template) => (
												<TableRow key={template.id}>
													<TableCell>
														<div className="font-medium">{template.name}</div>
														{template.description && (
															<div className="text-muted-foreground text-xs">
																{template.description}
															</div>
														)}
													</TableCell>
													<TableCell>{template.sections.length}</TableCell>
													<TableCell>
														<Badge variant={template.isActive ? "default" : "secondary"}>
															{template.isActive ? "Ativo" : "Inativo"}
														</Badge>
													</TableCell>
													<TableCell className="text-muted-foreground">
														{new Date(template.createdAt).toLocaleDateString("pt-BR")}
													</TableCell>
													<TableCell className="text-right">
														<Button asChild size="sm" variant="outline">
															<Link href={`/dashboard/anamnesis/templates/${template.id}`}>
																Editar
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
				</TabsContent>

				<TabsContent value="submissions" className="mt-6">
					<Card>
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
									<Send className="h-5 w-5 text-info" />
								</div>
								<div>
									<CardTitle className="text-lg font-display">Formulários Enviados</CardTitle>
									<CardDescription>
										Acompanhe o status dos formulários enviados aos pacientes.
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{submissions.items.length === 0 ? (
								<div className="text-center py-12">
									<FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
									<p className="font-medium">Nenhum envio registrado</p>
									<p className="text-muted-foreground text-sm mt-1">
										Envie uma anamnese para um paciente pelo prontuário dele.
									</p>
								</div>
							) : (
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Paciente</TableHead>
												<TableHead>Status</TableHead>
												<TableHead>Enviado em</TableHead>
												<TableHead>Expira em</TableHead>
												<TableHead className="text-right">Ações</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{submissions.items.map((submission) => {
												const statusConfig = STATUS_BADGES[submission.status];
												return (
													<TableRow key={submission.id}>
														<TableCell>
															<Link
																href={`/dashboard/patients/${submission.patientId}`}
																className="text-primary hover:underline font-medium"
															>
																{submission.patientId.slice(0, 8)}...
															</Link>
														</TableCell>
														<TableCell>
															<Badge variant={statusConfig.variant} className="gap-1">
																{STATUS_ICONS[submission.status]}
																{statusConfig.label}
															</Badge>
														</TableCell>
														<TableCell className="text-muted-foreground">
															{new Date(submission.createdAt).toLocaleDateString("pt-BR")}
														</TableCell>
														<TableCell className="text-muted-foreground">
															{new Date(submission.expiresAt).toLocaleDateString("pt-BR")}
														</TableCell>
														<TableCell className="text-right">
															{submission.status === "completed" ? (
																<Button asChild size="sm" variant="outline">
																	<Link href={`/dashboard/patients/${submission.patientId}`}>
																		Ver respostas
																	</Link>
																</Button>
															) : (
																<Button asChild size="sm" variant="ghost">
																	<Link href={`/form/${submission.token}`} target="_blank">
																		Abrir formulário
																	</Link>
																</Button>
															)}
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
				</TabsContent>
			</Tabs>
		</div>
	);
}
