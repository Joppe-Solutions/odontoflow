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
import { getPatient } from "@/lib/api/patients-server";
import { getPatientExams, type ExamStatus } from "@/lib/api/exams-server";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Plus, FileText, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface PageProps {
	params: Promise<{ id: string }>;
}

const STATUS_CONFIG: Record<
	ExamStatus,
	{ label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
	pending: { label: "Pending", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
	processing: { label: "Processing", variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
	ready: { label: "Ready", variant: "outline", icon: <CheckCircle className="h-3 w-3" /> },
	error: { label: "Error", variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
};

export default async function PatientExamsPage({ params }: PageProps) {
	const { orgId } = await auth();
	if (!orgId) {
		redirect("/select-organization");
	}

	const { id: patientId } = await params;

	let patient;
	let exams;
	try {
		[patient, exams] = await Promise.all([
			getPatient(patientId),
			getPatientExams(patientId),
		]);
	} catch (error) {
		if (error instanceof Error && error.message.includes("missing auth context")) {
			redirect("/select-organization");
		}
		notFound();
	}

	return (
		<div className="container mx-auto max-w-6xl space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">Exams</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						{patient.name} - {exams.total} exam{exams.total !== 1 ? "s" : ""}
					</p>
				</div>
				<div className="flex gap-2">
					<Button asChild variant="outline">
						<Link href={`/dashboard/patients/${patientId}`}>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Patient
						</Link>
					</Button>
					<Button asChild>
						<Link href={`/dashboard/patients/${patientId}/exams/upload`}>
							<Plus className="h-4 w-4 mr-2" />
							Upload Exam
						</Link>
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Exam History</CardTitle>
					<CardDescription>
						View and manage patient exam results.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{exams.items.length === 0 ? (
						<div className="text-center py-8">
							<FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<p className="text-muted-foreground">No exams uploaded yet.</p>
							<Button asChild className="mt-4">
								<Link href={`/dashboard/patients/${patientId}/exams/upload`}>
									Upload first exam
								</Link>
							</Button>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Exam</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Date</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{exams.items.map((exam) => {
									const statusConfig = STATUS_CONFIG[exam.status];
									return (
										<TableRow key={exam.id}>
											<TableCell>
												<div className="font-medium">{exam.name}</div>
												{exam.fileName && (
													<div className="text-muted-foreground text-xs">
														{exam.fileName}
													</div>
												)}
											</TableCell>
											<TableCell>
												<Badge variant="outline">{exam.type}</Badge>
											</TableCell>
											<TableCell>
												<Badge variant={statusConfig.variant} className="gap-1">
													{statusConfig.icon}
													{statusConfig.label}
												</Badge>
											</TableCell>
											<TableCell>
												{new Date(exam.createdAt).toLocaleDateString("en-US")}
											</TableCell>
											<TableCell className="text-right">
												<Button asChild size="sm" variant="outline">
													<Link href={`/dashboard/patients/${patientId}/exams/${exam.id}`}>
														View Details
													</Link>
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
