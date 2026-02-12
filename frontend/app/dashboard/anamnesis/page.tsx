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
import { ClipboardList, Plus, FileText, Clock, CheckCircle, XCircle } from "lucide-react";

const STATUS_BADGES: Record<SubmissionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
	pending: { label: "Pending", variant: "secondary" },
	in_progress: { label: "In Progress", variant: "default" },
	completed: { label: "Completed", variant: "outline" },
	expired: { label: "Expired", variant: "destructive" },
};

const STATUS_ICONS: Record<SubmissionStatus, React.ReactNode> = {
	pending: <Clock className="h-3 w-3" />,
	in_progress: <FileText className="h-3 w-3" />,
	completed: <CheckCircle className="h-3 w-3" />,
	expired: <XCircle className="h-3 w-3" />,
};

export default async function AnamnesisPage() {
	let templates;
	let submissions;
	[templates, submissions] = await Promise.all([
		listTemplates({ limit: 50 }),
		listSubmissions({ limit: 50 }),
	]);

	return (
		<div className="container mx-auto max-w-6xl space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">Anamnesis</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Create and manage health history forms for patients.
					</p>
				</div>
				<Button asChild>
					<Link href="/dashboard/anamnesis/templates/new">
						<Plus className="h-4 w-4 mr-2" />
						New Template
					</Link>
				</Button>
			</div>

			<Tabs defaultValue="templates">
				<TabsList>
					<TabsTrigger value="templates">
						<ClipboardList className="h-4 w-4 mr-2" />
						Templates ({templates.total})
					</TabsTrigger>
					<TabsTrigger value="submissions">
						<FileText className="h-4 w-4 mr-2" />
						Submissions ({submissions.total})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="templates" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Form Templates</CardTitle>
							<CardDescription>
								Reusable anamnesis forms that can be sent to patients.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{templates.items.length === 0 ? (
								<div className="text-center py-8">
									<ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
									<p className="text-muted-foreground">No templates created yet.</p>
									<Button asChild className="mt-4">
										<Link href="/dashboard/anamnesis/templates/new">
											Create your first template
										</Link>
									</Button>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Sections</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Created</TableHead>
											<TableHead className="text-right">Actions</TableHead>
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
														{template.isActive ? "Active" : "Inactive"}
													</Badge>
												</TableCell>
												<TableCell>
													{new Date(template.createdAt).toLocaleDateString("en-US")}
												</TableCell>
												<TableCell className="text-right">
													<Button asChild size="sm" variant="outline">
														<Link href={`/dashboard/anamnesis/templates/${template.id}`}>
															Edit
														</Link>
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="submissions" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Form Submissions</CardTitle>
							<CardDescription>
								Track the status of sent anamnesis forms.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{submissions.items.length === 0 ? (
								<div className="text-center py-8">
									<FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
									<p className="text-muted-foreground">No submissions yet.</p>
									<p className="text-muted-foreground text-sm mt-1">
										Send an anamnesis form to a patient to see submissions here.
									</p>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Patient ID</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Created</TableHead>
											<TableHead>Expires</TableHead>
											<TableHead className="text-right">Actions</TableHead>
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
															className="text-primary hover:underline"
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
													<TableCell>
														{new Date(submission.createdAt).toLocaleDateString("en-US")}
													</TableCell>
													<TableCell>
														{new Date(submission.expiresAt).toLocaleDateString("en-US")}
													</TableCell>
													<TableCell className="text-right">
														{submission.status === "completed" ? (
															<Button asChild size="sm" variant="outline">
																<Link href={`/dashboard/patients/${submission.patientId}`}>
																	View Responses
																</Link>
															</Button>
														) : (
															<Button asChild size="sm" variant="ghost">
																<Link href={`/form/${submission.token}`} target="_blank">
																	Open Form
																</Link>
															</Button>
														)}
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
