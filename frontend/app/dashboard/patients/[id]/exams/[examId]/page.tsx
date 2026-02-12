import { getPatient } from "@/lib/api/patients-server";
import { getExam, getPatientMarkerNames, getMarkerEvolution } from "@/lib/api/exams-server";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { ExamDetailClient } from "./exam-detail-client";

interface PageProps {
	params: Promise<{ id: string; examId: string }>;
	searchParams: Promise<{ marker?: string }>;
}

export default async function ExamDetailPage({ params, searchParams }: PageProps) {
	const { orgId } = await auth();
	if (!orgId) {
		redirect("/select-organization");
	}

	const { id: patientId, examId } = await params;
	const { marker: selectedMarker } = await searchParams;

	let patient;
	let exam;
	let markerNames;
	let evolution = null;

	try {
		[patient, exam, markerNames] = await Promise.all([
			getPatient(patientId),
			getExam(examId),
			getPatientMarkerNames(patientId),
		]);

		// Get evolution data for selected marker (or first available)
		const markerToFetch = selectedMarker || markerNames.names[0];
		if (markerToFetch) {
			evolution = await getMarkerEvolution(patientId, markerToFetch);
		}
	} catch (error) {
		if (error instanceof Error && error.message.includes("missing auth context")) {
			redirect("/select-organization");
		}
		notFound();
	}

	return (
		<ExamDetailClient
			patient={patient}
			exam={exam}
			markerNames={markerNames.names}
			initialEvolution={evolution}
			selectedMarker={selectedMarker || markerNames.names[0]}
		/>
	);
}
