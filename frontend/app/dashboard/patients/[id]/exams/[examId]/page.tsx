import { getPatient } from "@/lib/api/patients-server";
import { getExam, getPatientMarkerNames, getMarkerEvolution } from "@/lib/api/exams-server";
import { notFound } from "next/navigation";
import { ExamDetailClient } from "./exam-detail-client";

interface PageProps {
	params: Promise<{ id: string; examId: string }>;
	searchParams: Promise<{ marker?: string }>;
}

export default async function ExamDetailPage({ params, searchParams }: PageProps) {
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
	} catch {
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
