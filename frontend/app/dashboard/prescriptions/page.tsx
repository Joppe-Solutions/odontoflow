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
import { listPatients } from "@/lib/api/patients-server";
import {
	listPrescriptions,
	type PrescriptionStatus,
} from "@/lib/api/prescription-server";
import Link from "next/link";

const STATUS_VARIANT: Record<
	PrescriptionStatus,
	"default" | "secondary" | "destructive"
> = {
	draft: "secondary",
	signed: "default",
	cancelled: "destructive",
};

function compactPatientId(patientId: string): string {
	return patientId.length > 12 ? `${patientId.slice(0, 12)}...` : patientId;
}

export default async function PrescriptionsPage() {
	const [prescriptions, patients] = await Promise.all([
		listPrescriptions({ limit: 100, offset: 0 }),
		listPatients({ limit: 300, offset: 0 }),
	]);

	const patientNameById = new Map(
		patients.items.map((patient) => [patient.id, patient.name]),
	);

	return (
		<div className="container mx-auto max-w-6xl space-y-6">
			<div>
				<h1 className="text-3xl font-semibold">Prescriptions</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Organization-wide management of therapeutic prescriptions.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Prescription Registry</CardTitle>
					<CardDescription>Total prescriptions: {prescriptions.total}</CardDescription>
				</CardHeader>
				<CardContent>
					{prescriptions.items.length === 0 ? (
						<p className="text-sm text-muted-foreground">No prescriptions found.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Patient</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Items</TableHead>
									<TableHead>Created At</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{prescriptions.items.map((prescription) => (
									<TableRow key={prescription.id}>
										<TableCell>
											{patientNameById.get(prescription.patientId) ??
												`Patient ${compactPatientId(prescription.patientId)}`}
										</TableCell>
										<TableCell>
											<Badge variant={STATUS_VARIANT[prescription.status]}>
												{prescription.status}
											</Badge>
										</TableCell>
										<TableCell>{prescription.items.length}</TableCell>
										<TableCell>
											{new Date(prescription.createdAt).toLocaleDateString("en-US")}
										</TableCell>
										<TableCell className="text-right">
											<Button asChild variant="outline" size="sm">
												<Link href={`/dashboard/patients/${prescription.patientId}/prescriptions`}>
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

