import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { listExams, type ExamStatus } from "@/lib/api/exams-server";
import { listPatients } from "@/lib/api/patients-server";
import Link from "next/link";

const STATUS_LABEL: Record<ExamStatus, string> = {
	pending: "Pending",
	processing: "Processing",
	ready: "Ready",
	error: "Error",
};

const STATUS_VARIANT: Record<
	ExamStatus,
	"default" | "secondary" | "destructive" | "outline"
> = {
	pending: "secondary",
	processing: "default",
	ready: "outline",
	error: "destructive",
};

function compactPatientId(patientId: string): string {
	return patientId.length > 12 ? `${patientId.slice(0, 12)}...` : patientId;
}

export default async function ExamsPage() {
	const [exams, patients] = await Promise.all([
		listExams({ limit: 100, offset: 0 }),
		listPatients({ limit: 200, offset: 0 }),
	]);

	const patientNameById = new Map(
		patients.items.map((patient) => [patient.id, patient.name]),
	);

	return (
		<div className="container mx-auto max-w-6xl space-y-6">
			<div>
				<h1 className="text-3xl font-semibold">Exams</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Organization-wide view of uploaded exams and processing status.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Exam Registry</CardTitle>
					<CardDescription>Total exams: {exams.total}</CardDescription>
				</CardHeader>
				<CardContent>
					{exams.items.length === 0 ? (
						<p className="text-sm text-muted-foreground">No exams found.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Exam</TableHead>
									<TableHead>Patient</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Date</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{exams.items.map((exam) => (
									<TableRow key={exam.id}>
										<TableCell className="font-medium">{exam.name}</TableCell>
										<TableCell>
											{patientNameById.get(exam.patientId) ??
												`Patient ${compactPatientId(exam.patientId)}`}
										</TableCell>
										<TableCell>{exam.type}</TableCell>
										<TableCell>
											<Badge variant={STATUS_VARIANT[exam.status]}>
												{STATUS_LABEL[exam.status]}
											</Badge>
										</TableCell>
										<TableCell>
											{new Date(exam.createdAt).toLocaleDateString("en-US")}
										</TableCell>
										<TableCell className="text-right">
											<Button asChild variant="outline" size="sm">
												<Link href={`/dashboard/patients/${exam.patientId}/exams/${exam.id}`}>
													View
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
		</div>
	);
}

