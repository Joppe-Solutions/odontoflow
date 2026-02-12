import { APIError, api } from "encore.dev/api";
import log from "encore.dev/log";
import { randomUUID } from "node:crypto";
import { getAuthData } from "~encore/auth";
import { db } from "./db";

// Types
type ExamStatus = "pending" | "processing" | "ready" | "error";
type MarkerStatus = "normal" | "low" | "high" | "critical";
type MarkerSource = "ocr" | "manual";

// Row types
interface ExamRow {
	id: string;
	patient_id: string;
	organization_id: string;
	type: string;
	name: string;
	file_url: string | null;
	file_name: string | null;
	file_size: number | null;
	status: ExamStatus;
	ocr_raw: string | null;
	error_message: string | null;
	created_at: Date;
	updated_at: Date;
}

interface MarkerRow {
	id: string;
	exam_id: string;
	name: string;
	value: number | null;
	unit: string | null;
	reference_min: number | null;
	reference_max: number | null;
	status: MarkerStatus | null;
	source: MarkerSource;
	created_at: Date;
	updated_at: Date;
}

// API types
interface Exam {
	id: string;
	patientId: string;
	organizationId: string;
	type: string;
	name: string;
	fileUrl?: string;
	fileName?: string;
	fileSize?: number;
	status: ExamStatus;
	ocrRaw?: string;
	errorMessage?: string;
	createdAt: Date;
	updatedAt: Date;
}

interface ExamMarker {
	id: string;
	examId: string;
	name: string;
	value?: number;
	unit?: string;
	referenceMin?: number;
	referenceMax?: number;
	status?: MarkerStatus;
	source: MarkerSource;
	createdAt: Date;
	updatedAt: Date;
}

interface ExamWithMarkers extends Exam {
	markers: ExamMarker[];
}

// Params
interface CreateExamParams {
	patientId: string;
	type: string;
	name: string;
	fileUrl?: string;
	fileName?: string;
	fileSize?: number;
}

interface ListExamsParams {
	patientId?: string;
	status?: ExamStatus;
	limit?: number;
	offset?: number;
}

interface ListExamsResponse {
	items: Exam[];
	total: number;
}

interface AddMarkerParams {
	examId: string;
	name: string;
	value?: number;
	unit?: string;
	referenceMin?: number;
	referenceMax?: number;
}

interface UpdateMarkerParams {
	id: string;
	value?: number;
	unit?: string;
	referenceMin?: number;
	referenceMax?: number;
	status?: MarkerStatus;
}

interface BulkAddMarkersParams {
	examId: string;
	markers: Omit<AddMarkerParams, "examId">[];
}

interface MarkerEvolutionParams {
	patientId: string;
	markerName: string;
	limit?: number;
}

interface MarkerEvolutionPoint {
	examId: string;
	examName: string;
	examDate: Date;
	value: number;
	unit?: string;
	status?: MarkerStatus;
}

interface MarkerEvolutionResponse {
	markerName: string;
	points: MarkerEvolutionPoint[];
}

interface ProcessOcrParams {
	examId: string;
	ocrText: string;
}

// Converters
function toExam(row: ExamRow): Exam {
	return {
		id: row.id,
		patientId: row.patient_id,
		organizationId: row.organization_id,
		type: row.type,
		name: row.name,
		fileUrl: row.file_url ?? undefined,
		fileName: row.file_name ?? undefined,
		fileSize: row.file_size ?? undefined,
		status: row.status,
		ocrRaw: row.ocr_raw ?? undefined,
		errorMessage: row.error_message ?? undefined,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function toMarker(row: MarkerRow): ExamMarker {
	return {
		id: row.id,
		examId: row.exam_id,
		name: row.name,
		value: row.value ?? undefined,
		unit: row.unit ?? undefined,
		referenceMin: row.reference_min ?? undefined,
		referenceMax: row.reference_max ?? undefined,
		status: row.status ?? undefined,
		source: row.source,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

// Helpers
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

function calculateMarkerStatus(
	value: number | undefined,
	min: number | undefined,
	max: number | undefined
): MarkerStatus | undefined {
	if (value === undefined) return undefined;
	if (min === undefined && max === undefined) return undefined;

	if (min !== undefined && value < min) {
		return value < min * 0.8 ? "critical" : "low";
	}
	if (max !== undefined && value > max) {
		return value > max * 1.2 ? "critical" : "high";
	}
	return "normal";
}

// ============ EXAM ENDPOINTS ============

// Create a new exam
export const createExam = api(
	{ method: "POST", path: "/exams", expose: true, auth: true },
	async (params: CreateExamParams): Promise<Exam> => {
		const authData = requireAuthContext();
		const id = randomUUID();

		const row = await db.queryRow<ExamRow>`
			INSERT INTO exams (
				id, patient_id, organization_id, type, name, file_url, file_name, file_size, status
			) VALUES (
				${id},
				${params.patientId},
				${authData.orgID},
				${params.type},
				${params.name.trim()},
				${params.fileUrl || null},
				${params.fileName || null},
				${params.fileSize || null},
				${"pending"}
			)
			RETURNING *
		`;

		if (!row) {
			throw APIError.internal("failed to create exam");
		}

		log.info("exam created", {
			examID: row.id,
			patientID: params.patientId,
			orgID: authData.orgID,
		});

		return toExam(row);
	},
);

// List exams
export const listExams = api(
	{ method: "GET", path: "/exams", expose: true, auth: true },
	async (params: ListExamsParams): Promise<ListExamsResponse> => {
		const authData = requireAuthContext();
		const limit = normalizeLimit(params.limit);
		const offset = normalizeOffset(params.offset);

		const items: Exam[] = [];
		for await (const row of db.query<ExamRow>`
			SELECT * FROM exams
			WHERE organization_id = ${authData.orgID}
			  AND (${params.patientId || null}::TEXT IS NULL OR patient_id = ${params.patientId || null})
			  AND (${params.status || null}::TEXT IS NULL OR status = ${params.status || null})
			ORDER BY created_at DESC
			LIMIT ${limit} OFFSET ${offset}
		`) {
			items.push(toExam(row));
		}

		const totalRow = await db.queryRow<{ count: number }>`
			SELECT COUNT(*)::INT AS count FROM exams
			WHERE organization_id = ${authData.orgID}
			  AND (${params.patientId || null}::TEXT IS NULL OR patient_id = ${params.patientId || null})
			  AND (${params.status || null}::TEXT IS NULL OR status = ${params.status || null})
		`;

		return { items, total: totalRow?.count ?? 0 };
	},
);

// Get patient exams
export const getPatientExams = api(
	{ method: "GET", path: "/exams/patient/:patientId", expose: true, auth: true },
	async ({ patientId }: { patientId: string }): Promise<ListExamsResponse> => {
		const authData = requireAuthContext();

		const items: Exam[] = [];
		for await (const row of db.query<ExamRow>`
			SELECT * FROM exams
			WHERE patient_id = ${patientId} AND organization_id = ${authData.orgID}
			ORDER BY created_at DESC
		`) {
			items.push(toExam(row));
		}

		return { items, total: items.length };
	},
);

// Get exam with markers
export const getExam = api(
	{ method: "GET", path: "/exams/:id", expose: true, auth: true },
	async ({ id }: { id: string }): Promise<ExamWithMarkers> => {
		const authData = requireAuthContext();

		const examRow = await db.queryRow<ExamRow>`
			SELECT * FROM exams
			WHERE id = ${id} AND organization_id = ${authData.orgID}
		`;

		if (!examRow) {
			throw APIError.notFound("exam not found");
		}

		const markers: ExamMarker[] = [];
		for await (const markerRow of db.query<MarkerRow>`
			SELECT * FROM exam_markers WHERE exam_id = ${id} ORDER BY name
		`) {
			markers.push(toMarker(markerRow));
		}

		return { ...toExam(examRow), markers };
	},
);

// Update exam status
export const updateExamStatus = api(
	{ method: "PUT", path: "/exams/:id/status", expose: true, auth: true },
	async ({ id, status, errorMessage }: { id: string; status: ExamStatus; errorMessage?: string }): Promise<Exam> => {
		const authData = requireAuthContext();

		const row = await db.queryRow<ExamRow>`
			UPDATE exams
			SET status = ${status}, error_message = ${errorMessage || null}, updated_at = NOW()
			WHERE id = ${id} AND organization_id = ${authData.orgID}
			RETURNING *
		`;

		if (!row) {
			throw APIError.notFound("exam not found");
		}

		return toExam(row);
	},
);

// Store OCR result
export const storeOcrResult = api(
	{ method: "POST", path: "/exams/:examId/ocr", expose: true, auth: true },
	async (params: ProcessOcrParams): Promise<Exam> => {
		const authData = requireAuthContext();

		const row = await db.queryRow<ExamRow>`
			UPDATE exams
			SET ocr_raw = ${params.ocrText}, status = 'ready', updated_at = NOW()
			WHERE id = ${params.examId} AND organization_id = ${authData.orgID}
			RETURNING *
		`;

		if (!row) {
			throw APIError.notFound("exam not found");
		}

		log.info("OCR result stored", { examID: params.examId, orgID: authData.orgID });

		return toExam(row);
	},
);

// ============ MARKER ENDPOINTS ============

// Add a single marker
export const addMarker = api(
	{ method: "POST", path: "/exams/:examId/markers", expose: true, auth: true },
	async (params: AddMarkerParams): Promise<ExamMarker> => {
		const authData = requireAuthContext();
		const id = randomUUID();

		// Verify exam belongs to org
		const exam = await db.queryRow<ExamRow>`
			SELECT * FROM exams WHERE id = ${params.examId} AND organization_id = ${authData.orgID}
		`;
		if (!exam) {
			throw APIError.notFound("exam not found");
		}

		const status = calculateMarkerStatus(params.value, params.referenceMin, params.referenceMax);

		const row = await db.queryRow<MarkerRow>`
			INSERT INTO exam_markers (
				id, exam_id, name, value, unit, reference_min, reference_max, status, source
			) VALUES (
				${id},
				${params.examId},
				${params.name.trim()},
				${params.value ?? null},
				${params.unit || null},
				${params.referenceMin ?? null},
				${params.referenceMax ?? null},
				${status || null},
				${"manual"}
			)
			RETURNING *
		`;

		if (!row) {
			throw APIError.internal("failed to add marker");
		}

		return toMarker(row);
	},
);

// Add multiple markers (from OCR)
export const bulkAddMarkers = api(
	{ method: "POST", path: "/exams/:examId/markers/bulk", expose: true, auth: true },
	async (params: BulkAddMarkersParams): Promise<{ count: number }> => {
		const authData = requireAuthContext();

		// Verify exam belongs to org
		const exam = await db.queryRow<ExamRow>`
			SELECT * FROM exams WHERE id = ${params.examId} AND organization_id = ${authData.orgID}
		`;
		if (!exam) {
			throw APIError.notFound("exam not found");
		}

		let count = 0;
		for (const marker of params.markers) {
			const id = randomUUID();
			const status = calculateMarkerStatus(marker.value, marker.referenceMin, marker.referenceMax);

			await db.exec`
				INSERT INTO exam_markers (
					id, exam_id, name, value, unit, reference_min, reference_max, status, source
				) VALUES (
					${id},
					${params.examId},
					${marker.name.trim()},
					${marker.value ?? null},
					${marker.unit || null},
					${marker.referenceMin ?? null},
					${marker.referenceMax ?? null},
					${status || null},
					${"ocr"}
				)
			`;
			count++;
		}

		log.info("bulk markers added", { examID: params.examId, count, orgID: authData.orgID });

		return { count };
	},
);

// Update a marker
export const updateMarker = api(
	{ method: "PUT", path: "/exams/markers/:id", expose: true, auth: true },
	async (params: UpdateMarkerParams): Promise<ExamMarker> => {
		const authData = requireAuthContext();

		// Verify marker belongs to exam in org
		const existing = await db.queryRow<MarkerRow & { org_id: string }>`
			SELECT m.*, e.organization_id as org_id
			FROM exam_markers m
			JOIN exams e ON e.id = m.exam_id
			WHERE m.id = ${params.id}
		`;

		if (!existing || existing.org_id !== authData.orgID) {
			throw APIError.notFound("marker not found");
		}

		const newValue = params.value ?? existing.value ?? undefined;
		const newMin = params.referenceMin ?? existing.reference_min ?? undefined;
		const newMax = params.referenceMax ?? existing.reference_max ?? undefined;
		const calculatedStatus = params.status ?? calculateMarkerStatus(newValue, newMin, newMax);

		const row = await db.queryRow<MarkerRow>`
			UPDATE exam_markers
			SET
				value = COALESCE(${params.value ?? null}, value),
				unit = COALESCE(${params.unit || null}, unit),
				reference_min = COALESCE(${params.referenceMin ?? null}, reference_min),
				reference_max = COALESCE(${params.referenceMax ?? null}, reference_max),
				status = ${calculatedStatus || null},
				source = 'manual',
				updated_at = NOW()
			WHERE id = ${params.id}
			RETURNING *
		`;

		if (!row) {
			throw APIError.notFound("marker not found");
		}

		return toMarker(row);
	},
);

// Delete a marker
export const deleteMarker = api(
	{ method: "DELETE", path: "/exams/markers/:id", expose: true, auth: true },
	async ({ id }: { id: string }): Promise<{ success: boolean }> => {
		const authData = requireAuthContext();

		// Verify marker belongs to exam in org
		const existing = await db.queryRow<{ org_id: string }>`
			SELECT e.organization_id as org_id
			FROM exam_markers m
			JOIN exams e ON e.id = m.exam_id
			WHERE m.id = ${id}
		`;

		if (!existing || existing.org_id !== authData.orgID) {
			throw APIError.notFound("marker not found");
		}

		await db.exec`DELETE FROM exam_markers WHERE id = ${id}`;

		return { success: true };
	},
);

// Get marker evolution for a patient
export const getMarkerEvolution = api(
	{ method: "GET", path: "/exams/patient/:patientId/evolution/:markerName", expose: true, auth: true },
	async (params: MarkerEvolutionParams): Promise<MarkerEvolutionResponse> => {
		const authData = requireAuthContext();
		const limit = normalizeLimit(params.limit);

		const points: MarkerEvolutionPoint[] = [];
		for await (const row of db.query<{
			exam_id: string;
			exam_name: string;
			exam_date: Date;
			value: number;
			unit: string | null;
			status: MarkerStatus | null;
		}>`
			SELECT
				e.id as exam_id,
				e.name as exam_name,
				e.created_at as exam_date,
				m.value,
				m.unit,
				m.status
			FROM exam_markers m
			JOIN exams e ON e.id = m.exam_id
			WHERE e.patient_id = ${params.patientId}
			  AND e.organization_id = ${authData.orgID}
			  AND m.name ILIKE ${params.markerName}
			  AND m.value IS NOT NULL
			ORDER BY e.created_at DESC
			LIMIT ${limit}
		`) {
			points.push({
				examId: row.exam_id,
				examName: row.exam_name,
				examDate: row.exam_date,
				value: row.value,
				unit: row.unit ?? undefined,
				status: row.status ?? undefined,
			});
		}

		return { markerName: params.markerName, points: points.reverse() };
	},
);

// Get list of unique marker names for a patient
export const getPatientMarkerNames = api(
	{ method: "GET", path: "/exams/patient/:patientId/markers", expose: true, auth: true },
	async ({ patientId }: { patientId: string }): Promise<{ names: string[] }> => {
		const authData = requireAuthContext();

		const names: string[] = [];
		for await (const row of db.query<{ name: string }>`
			SELECT DISTINCT m.name
			FROM exam_markers m
			JOIN exams e ON e.id = m.exam_id
			WHERE e.patient_id = ${patientId}
			  AND e.organization_id = ${authData.orgID}
			ORDER BY m.name
		`) {
			names.push(row.name);
		}

		return { names };
	},
);
