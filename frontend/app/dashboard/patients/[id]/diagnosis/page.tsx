import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
	analyzePatientDiagnosis,
	listDiagnoses,
	reviewDiagnosis,
	type DiagnosisStatus,
} from "@/lib/api/diagnosis-server";
import { getPatient } from "@/lib/api/patients-server";
import { Brain, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

interface PageProps {
	params: Promise<{ id: string }>;
}

function statusBadgeVariant(status: DiagnosisStatus): "default" | "secondary" {
	return status === "reviewed" ? "default" : "secondary";
}

async function analyzeAction(formData: FormData) {
	"use server";

	const patientId = String(formData.get("patientId") || "");
	if (!patientId) {
		throw new Error("Missing patient id");
	}

	await analyzePatientDiagnosis(patientId);
	revalidatePath(`/dashboard/patients/${patientId}`);
	revalidatePath(`/dashboard/patients/${patientId}/diagnosis`);
	redirect(`/dashboard/patients/${patientId}/diagnosis`);
}

async function reviewAction(formData: FormData) {
	"use server";

	const patientId = String(formData.get("patientId") || "");
	const diagnosisId = String(formData.get("diagnosisId") || "");
	const notes = String(formData.get("clinicalNotes") || "").trim();

	if (!patientId || !diagnosisId) {
		throw new Error("Missing identifiers");
	}

	await reviewDiagnosis(diagnosisId, notes || undefined);
	revalidatePath(`/dashboard/patients/${patientId}/diagnosis`);
	redirect(`/dashboard/patients/${patientId}/diagnosis`);
}

export default async function PatientDiagnosisPage({ params }: PageProps) {
	const { id: patientId } = await params;

	let patient;
	let diagnosisList;
	try {
		[patient, diagnosisList] = await Promise.all([
			getPatient(patientId),
			listDiagnoses({ patientId, limit: 10, offset: 0 }),
		]);
	} catch {
		notFound();
	}

	const latest = diagnosisList.items[0];

	return (
		<div className="container mx-auto max-w-6xl space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">Diagnosis</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Clinical support analysis for {patient.name}
					</p>
				</div>
				<div className="flex gap-2">
					<Button asChild variant="outline">
						<Link href={`/dashboard/patients/${patientId}`}>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Patient
						</Link>
					</Button>
					<Button asChild variant="outline">
						<Link href={`/dashboard/patients/${patientId}/prescriptions`}>
							Prescriptions
						</Link>
					</Button>
					<form action={analyzeAction}>
						<input type="hidden" name="patientId" value={patientId} />
						<Button type="submit">
							<Brain className="h-4 w-4 mr-2" />
							Run New Analysis
						</Button>
					</form>
				</div>
			</div>

			{!latest ? (
				<Card>
					<CardHeader>
						<CardTitle>No diagnosis analysis yet</CardTitle>
						<CardDescription>
							Run analysis to generate evidence-based hypotheses from anamnesis and exams.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form action={analyzeAction}>
							<input type="hidden" name="patientId" value={patientId} />
							<Button type="submit">
								<Brain className="h-4 w-4 mr-2" />
								Generate First Analysis
							</Button>
						</form>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<CardTitle>Latest Analysis</CardTitle>
							<Badge variant={statusBadgeVariant(latest.status)}>
								{latest.status}
							</Badge>
							<Badge variant="outline">{latest.confidence}% confidence</Badge>
						</div>
						<CardDescription>
							Created on{" "}
							{new Date(latest.createdAt).toLocaleString("en-US")}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<p className="text-sm font-medium">Summary</p>
							<p className="text-sm text-muted-foreground">{latest.summary}</p>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium">Reasoning</p>
							<p className="text-sm text-muted-foreground">{latest.reasoning}</p>
						</div>

						<div className="space-y-3">
							<p className="text-sm font-medium">Suggested Conditions</p>
							<div className="grid gap-3 md:grid-cols-2">
								{latest.suggestedConditions.map((condition, index) => (
									<div key={`${condition.name}-${index}`} className="rounded-md border p-3 space-y-2">
										<div className="flex items-center justify-between gap-2">
											<p className="text-sm font-medium">{condition.name}</p>
											<Badge variant="outline">
												{condition.probability}% • {condition.severity}
											</Badge>
										</div>
										{condition.supportingEvidence.length > 0 && (
											<ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
												{condition.supportingEvidence.map((evidence) => (
													<li key={evidence}>{evidence}</li>
												))}
											</ul>
										)}
									</div>
								))}
							</div>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium">Recommended Exams</p>
							{latest.recommendedExams.length === 0 ? (
								<p className="text-sm text-muted-foreground">No additional exam recommendation.</p>
							) : (
								<div className="flex flex-wrap gap-2">
									{latest.recommendedExams.map((examName) => (
										<Badge key={examName} variant="outline">
											{examName}
										</Badge>
									))}
								</div>
							)}
						</div>

						{latest.status === "draft" && (
							<div className="space-y-3 rounded-md border p-4">
								<div>
									<p className="text-sm font-medium">Clinical Validation</p>
									<p className="text-xs text-muted-foreground mt-1">
										Review this analysis and register final clinical notes.
									</p>
								</div>
								<form action={reviewAction} className="space-y-3">
									<input type="hidden" name="patientId" value={patientId} />
									<input type="hidden" name="diagnosisId" value={latest.id} />
									<Textarea
										name="clinicalNotes"
										placeholder="Clinical validation notes..."
										defaultValue={latest.clinicalNotes ?? ""}
									/>
									<Button type="submit">Mark as Reviewed</Button>
								</form>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Analysis History</CardTitle>
					<CardDescription>
						Recent diagnosis runs for this patient.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{diagnosisList.items.length === 0 ? (
						<p className="text-sm text-muted-foreground">No analysis history.</p>
					) : (
						<div className="space-y-2">
							{diagnosisList.items.map((diagnosis) => (
								<div
									key={diagnosis.id}
									className="rounded-md border p-3 flex flex-wrap items-center justify-between gap-2"
								>
									<div>
										<p className="text-sm font-medium">{diagnosis.summary}</p>
										<p className="text-xs text-muted-foreground">
											{new Date(diagnosis.createdAt).toLocaleString("en-US")}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Badge variant={statusBadgeVariant(diagnosis.status)}>
											{diagnosis.status}
										</Badge>
										<Badge variant="outline">{diagnosis.confidence}%</Badge>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
