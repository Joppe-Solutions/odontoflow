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
import { listDiagnoses, type DiagnosisStatus } from "@/lib/api/diagnosis-server";
import { listPatients } from "@/lib/api/patients-server";
import Link from "next/link";

const STATUS_VARIANT: Record<DiagnosisStatus, "default" | "secondary"> = {
	draft: "secondary",
	reviewed: "default",
};

function compactPatientId(patientId: string): string {
	return patientId.length > 12 ? `${patientId.slice(0, 12)}...` : patientId;
}

export default async function DiagnosisPage() {
	const [diagnoses, patients] = await Promise.all([
		listDiagnoses({ limit: 100, offset: 0 }),
		listPatients({ limit: 200, offset: 0 }),
	]);

	const patientNameById = new Map(
		patients.items.map((patient) => [patient.id, patient.name]),
	);

	return (
		<div className="container mx-auto max-w-6xl space-y-6">
			<div>
				<h1 className="text-3xl font-semibold">Diagnosis</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Organization-wide history of clinical diagnosis analyses.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Diagnosis Registry</CardTitle>
					<CardDescription>Total analyses: {diagnoses.total}</CardDescription>
				</CardHeader>
				<CardContent>
					{diagnoses.items.length === 0 ? (
						<p className="text-sm text-muted-foreground">No diagnosis records found.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Summary</TableHead>
									<TableHead>Patient</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Confidence</TableHead>
									<TableHead>Date</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{diagnoses.items.map((diagnosis) => (
									<TableRow key={diagnosis.id}>
										<TableCell className="max-w-md">
											<p className="font-medium truncate">{diagnosis.summary}</p>
										</TableCell>
										<TableCell>
											{patientNameById.get(diagnosis.patientId) ??
												`Patient ${compactPatientId(diagnosis.patientId)}`}
										</TableCell>
										<TableCell>
											<Badge variant={STATUS_VARIANT[diagnosis.status]}>
												{diagnosis.status}
											</Badge>
										</TableCell>
										<TableCell>{diagnosis.confidence}%</TableCell>
										<TableCell>
											{new Date(diagnosis.createdAt).toLocaleDateString("en-US")}
										</TableCell>
										<TableCell className="text-right">
											<Button asChild variant="outline" size="sm">
												<Link href={`/dashboard/patients/${diagnosis.patientId}/diagnosis`}>
													Open
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

