import { APIError, api } from "encore.dev/api";
import log from "encore.dev/log";
import { randomUUID } from "node:crypto";
import { getPatientSubmissions } from "../anamnesis/anamnesis";
import { getExam, getPatientExams } from "../exams/exams";
import { getPatient, recordSystemTimelineEvent } from "../patients/patients";
import { getAuthData } from "~encore/auth";
import {
	analyzeDiagnosis,
	type DiagnosisCondition,
	type DiagnosisInputMarker,
} from "./engine";
import { db } from "./db";

type DiagnosisStatus = "draft" | "reviewed";

interface DiagnosisRow {
	id: string;
	patient_id: string;
	organization_id: string;
	status: DiagnosisStatus;
	confidence: number;
	summary: string;
	reasoning: string;
	suggested_conditions: DiagnosisCondition[];
	recommended_exams: string[];
	input_snapshot: Record<string, unknown> | null;
	clinical_notes: string | null;
	created_by: string;
	reviewed_by: string | null;
	reviewed_at: Date | null;
	created_at: Date;
	updated_at: Date;
}

interface Diagnosis {
	id: string;
	patientId: string;
	organizationId: string;
	status: DiagnosisStatus;
	confidence: number;
	summary: string;
	reasoning: string;
	suggestedConditions: DiagnosisCondition[];
	recommendedExams: string[];
	inputSnapshot?: Record<string, unknown>;
	clinicalNotes?: string;
	createdBy: string;
	reviewedBy?: string;
	reviewedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

interface AnalyzePatientParams {
	patientId: string;
}

interface ListDiagnosesParams {
	patientId?: string;
	status?: DiagnosisStatus;
	limit?: number;
	offset?: number;
}

interface ListDiagnosesResponse {
	items: Diagnosis[];
	total: number;
}

interface ReviewDiagnosisParams {
	id: string;
	clinicalNotes?: string;
}

function toDiagnosis(row: DiagnosisRow): Diagnosis {
	return {
		id: row.id,
		patientId: row.patient_id,
		organizationId: row.organization_id,
		status: row.status,
		confidence: row.confidence,
		summary: row.summary,
		reasoning: row.reasoning,
		suggestedConditions: row.suggested_conditions || [],
		recommendedExams: row.recommended_exams || [],
		inputSnapshot: row.input_snapshot ?? undefined,
		clinicalNotes: row.clinical_notes ?? undefined,
		createdBy: row.created_by,
		reviewedBy: row.reviewed_by ?? undefined,
		reviewedAt: row.reviewed_at ?? undefined,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function requireAuthContext(): { orgID: string; userID: string } {
	const authData = getAuthData();
	if (!authData?.orgID || !authData.userID) {
		throw APIError.unauthenticated("missing auth context");
	}
	return authData;
}

function normalizeLimit(limit?: number): number {
	if (!limit || limit <= 0) return 20;
	return Math.min(limit, 100);
}

function normalizeOffset(offset?: number): number {
	if (!offset || offset < 0) return 0;
	return offset;
}

async function collectMarkersFromReadyExams(
	patientId: string,
): Promise<{ markers: DiagnosisInputMarker[]; examIDs: string[] }> {
	const exams = await getPatientExams({ patientId });
	const readyExams = exams.items.filter((exam) => exam.status === "ready").slice(0, 10);

	const examsWithMarkers = await Promise.all(
		readyExams.map((exam) => getExam({ id: exam.id })),
	);

	const markers: DiagnosisInputMarker[] = [];
	for (const exam of examsWithMarkers) {
		for (const marker of exam.markers) {
			markers.push({
				name: marker.name,
				value: marker.value ?? undefined,
				unit: marker.unit ?? undefined,
				referenceMin: marker.referenceMin ?? undefined,
				referenceMax: marker.referenceMax ?? undefined,
				status: marker.status ?? undefined,
				examDate: exam.createdAt,
			});
		}
	}

	return { markers, examIDs: readyExams.map((exam) => exam.id) };
}

// Run a new diagnosis analysis for a patient.
export const analyzePatient = api(
	{ method: "POST", path: "/diagnosis/analyze", expose: true, auth: true },
	async (params: AnalyzePatientParams): Promise<Diagnosis> => {
		const authData = requireAuthContext();

		// Verify patient belongs to org by using patients service access control.
		await getPatient({ id: params.patientId });

		const submissions = await getPatientSubmissions({ patientId: params.patientId });
		const latestCompletedSubmission = submissions.items.find(
			(submission) => submission.status === "completed" && submission.responses,
		);

		const { markers, examIDs } = await collectMarkersFromReadyExams(params.patientId);

		const analysis = analyzeDiagnosis({
			responses: latestCompletedSubmission?.responses ?? undefined,
			markers,
		});

		const id = randomUUID();
		const inputSnapshot = {
			submissionId: latestCompletedSubmission?.id ?? null,
			analyzedExamIds: examIDs,
			analyzedMarkersCount: markers.length,
			analyzedAt: new Date().toISOString(),
		};

		const row = await db.queryRow<DiagnosisRow>`
			INSERT INTO diagnoses (
				id,
				patient_id,
				organization_id,
				status,
				confidence,
				summary,
				reasoning,
				suggested_conditions,
				recommended_exams,
				input_snapshot,
				created_by
			) VALUES (
				${id},
				${params.patientId},
				${authData.orgID},
				${"draft"},
				${analysis.confidence},
				${analysis.summary},
				${analysis.reasoning},
				${JSON.stringify(analysis.conditions)}::JSONB,
				${JSON.stringify(analysis.recommendedExams)}::JSONB,
				${JSON.stringify(inputSnapshot)}::JSONB,
				${authData.userID}
			)
			RETURNING *
		`;

		if (!row) {
			throw APIError.internal("failed to create diagnosis");
		}

		try {
			await recordSystemTimelineEvent({
				patientId: params.patientId,
				organizationId: authData.orgID,
				eventType: "diagnosis_created",
				title: "Diagnosis analysis generated",
				description: `Confidence: ${analysis.confidence}%`,
				metadata: {
					diagnosisId: id,
					topCondition: analysis.conditions[0]?.name ?? null,
				},
				actorId: authData.userID,
			});
		} catch (error) {
			log.warn("failed to append diagnosis timeline event", { error, diagnosisID: id });
		}

		log.info("diagnosis generated", {
			diagnosisID: id,
			patientID: params.patientId,
			orgID: authData.orgID,
			userID: authData.userID,
		});

		return toDiagnosis(row);
	},
);

// List diagnosis records for organization (optionally filtered by patient/status).
export const listDiagnoses = api(
	{ method: "GET", path: "/diagnosis", expose: true, auth: true },
	async (params: ListDiagnosesParams): Promise<ListDiagnosesResponse> => {
		const authData = requireAuthContext();
		const limit = normalizeLimit(params.limit);
		const offset = normalizeOffset(params.offset);

		const items: Diagnosis[] = [];
		for await (const row of db.query<DiagnosisRow>`
			SELECT *
			FROM diagnoses
			WHERE organization_id = ${authData.orgID}
			  AND (${params.patientId || null}::TEXT IS NULL OR patient_id = ${params.patientId || null})
			  AND (${params.status || null}::TEXT IS NULL OR status = ${params.status || null})
			ORDER BY created_at DESC
			LIMIT ${limit}
			OFFSET ${offset}
		`) {
			items.push(toDiagnosis(row));
		}

		const totalRow = await db.queryRow<{ count: number }>`
			SELECT COUNT(*)::INT AS count
			FROM diagnoses
			WHERE organization_id = ${authData.orgID}
			  AND (${params.patientId || null}::TEXT IS NULL OR patient_id = ${params.patientId || null})
			  AND (${params.status || null}::TEXT IS NULL OR status = ${params.status || null})
		`;

		return {
			items,
			total: totalRow?.count ?? 0,
		};
	},
);

// Get a diagnosis by id in the authenticated organization.
export const getDiagnosis = api(
	{ method: "GET", path: "/diagnosis/:id", expose: true, auth: true },
	async ({ id }: { id: string }): Promise<Diagnosis> => {
		const authData = requireAuthContext();
		const row = await db.queryRow<DiagnosisRow>`
			SELECT *
			FROM diagnoses
			WHERE id = ${id}
			  AND organization_id = ${authData.orgID}
		`;

		if (!row) {
			throw APIError.notFound("diagnosis not found");
		}

		return toDiagnosis(row);
	},
);

// Mark a diagnosis as reviewed by a professional.
export const reviewDiagnosis = api(
	{ method: "PUT", path: "/diagnosis/:id/review", expose: true, auth: true },
	async (params: ReviewDiagnosisParams): Promise<Diagnosis> => {
		const authData = requireAuthContext();

		const row = await db.queryRow<DiagnosisRow>`
			UPDATE diagnoses
			SET
				status = ${"reviewed"},
				clinical_notes = COALESCE(${params.clinicalNotes?.trim() || null}, clinical_notes),
				reviewed_by = ${authData.userID},
				reviewed_at = NOW(),
				updated_at = NOW()
			WHERE id = ${params.id}
			  AND organization_id = ${authData.orgID}
			RETURNING *
		`;

		if (!row) {
			throw APIError.notFound("diagnosis not found");
		}

		log.info("diagnosis reviewed", {
			diagnosisID: params.id,
			patientID: row.patient_id,
			orgID: authData.orgID,
			userID: authData.userID,
		});

		return toDiagnosis(row);
	},
);

