import { serverSideEnv } from "@/lib/env/server-side";
import { auth } from "@clerk/nextjs/server";
import { Environment, Local, PreviewEnv } from "./encore-client";

// Types
export type ExamStatus = "pending" | "processing" | "ready" | "error";
export type MarkerStatus = "normal" | "low" | "high" | "critical";
export type MarkerSource = "ocr" | "manual";

export interface Exam {
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
	createdAt: string;
	updatedAt: string;
}

export interface ExamMarker {
	id: string;
	examId: string;
	name: string;
	value?: number;
	unit?: string;
	referenceMin?: number;
	referenceMax?: number;
	status?: MarkerStatus;
	source: MarkerSource;
	createdAt: string;
	updatedAt: string;
}

export interface ExamWithMarkers extends Exam {
	markers: ExamMarker[];
}

export interface CreateExamParams {
	patientId: string;
	type: string;
	name: string;
	fileUrl?: string;
	fileName?: string;
	fileSize?: number;
}

export interface ListExamsParams {
	patientId?: string;
	status?: ExamStatus;
	limit?: number;
	offset?: number;
}

export interface ListExamsResponse {
	items: Exam[];
	total: number;
}

export interface AddMarkerParams {
	examId: string;
	name: string;
	value?: number;
	unit?: string;
	referenceMin?: number;
	referenceMax?: number;
}

export interface UpdateMarkerParams {
	id: string;
	value?: number;
	unit?: string;
	referenceMin?: number;
	referenceMax?: number;
	status?: MarkerStatus;
}

export interface MarkerEvolutionPoint {
	examId: string;
	examName: string;
	examDate: string;
	value: number;
	unit?: string;
	status?: MarkerStatus;
}

export interface MarkerEvolutionResponse {
	markerName: string;
	points: MarkerEvolutionPoint[];
}

function getEncoreBaseUrl(): string {
	if (serverSideEnv.VERCEL_ENV === "production") {
		return Environment("staging");
	}
	if (serverSideEnv.VERCEL_ENV === "preview") {
		if (!serverSideEnv.VERCEL_GIT_PULL_REQUEST_ID) {
			throw new Error("VERCEL_GIT_PULL_REQUEST_ID is not set");
		}
		return PreviewEnv(serverSideEnv.VERCEL_GIT_PULL_REQUEST_ID);
	}
	return Local;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const { getToken, orgId } = await auth();
	const token = await getToken();

	if (!token) {
		throw new Error("Missing Clerk token in server request");
	}

	const res = await fetch(`${getEncoreBaseUrl()}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
			...(orgId ? { "X-Organization-Id": orgId } : {}),
			...(init?.headers || {}),
		},
		cache: "no-store",
	});

	if (!res.ok) {
		const message = await res.text();
		throw new Error(`Exams API error ${res.status}: ${message}`);
	}

	return (await res.json()) as T;
}

// Exam APIs
export async function createExam(params: CreateExamParams): Promise<Exam> {
	return request<Exam>("/exams", {
		method: "POST",
		body: JSON.stringify(params),
	});
}

export async function listExams(params: ListExamsParams = {}): Promise<ListExamsResponse> {
	const q = new URLSearchParams();
	if (params.patientId) q.set("patientId", params.patientId);
	if (params.status) q.set("status", params.status);
	if (params.limit !== undefined) q.set("limit", String(params.limit));
	if (params.offset !== undefined) q.set("offset", String(params.offset));

	const suffix = q.toString() ? `?${q.toString()}` : "";
	return request<ListExamsResponse>(`/exams${suffix}`, { method: "GET" });
}

export async function getPatientExams(patientId: string): Promise<ListExamsResponse> {
	return request<ListExamsResponse>(`/exams/patient/${patientId}`, { method: "GET" });
}

export async function getExam(id: string): Promise<ExamWithMarkers> {
	return request<ExamWithMarkers>(`/exams/${id}`, { method: "GET" });
}

export async function updateExamStatus(
	id: string,
	status: ExamStatus,
	errorMessage?: string
): Promise<Exam> {
	return request<Exam>(`/exams/${id}/status`, {
		method: "PUT",
		body: JSON.stringify({ id, status, errorMessage }),
	});
}

export async function storeOcrResult(examId: string, ocrText: string): Promise<Exam> {
	return request<Exam>(`/exams/${examId}/ocr`, {
		method: "POST",
		body: JSON.stringify({ examId, ocrText }),
	});
}

// Marker APIs
export async function addMarker(params: AddMarkerParams): Promise<ExamMarker> {
	return request<ExamMarker>(`/exams/${params.examId}/markers`, {
		method: "POST",
		body: JSON.stringify(params),
	});
}

export async function bulkAddMarkers(
	examId: string,
	markers: Omit<AddMarkerParams, "examId">[]
): Promise<{ count: number }> {
	return request<{ count: number }>(`/exams/${examId}/markers/bulk`, {
		method: "POST",
		body: JSON.stringify({ examId, markers }),
	});
}

export async function updateMarker(params: UpdateMarkerParams): Promise<ExamMarker> {
	return request<ExamMarker>(`/exams/markers/${params.id}`, {
		method: "PUT",
		body: JSON.stringify(params),
	});
}

export async function deleteMarker(id: string): Promise<{ success: boolean }> {
	return request<{ success: boolean }>(`/exams/markers/${id}`, { method: "DELETE" });
}

export async function getMarkerEvolution(
	patientId: string,
	markerName: string,
	limit?: number
): Promise<MarkerEvolutionResponse> {
	const q = new URLSearchParams();
	if (limit !== undefined) q.set("limit", String(limit));
	const suffix = q.toString() ? `?${q.toString()}` : "";
	return request<MarkerEvolutionResponse>(
		`/exams/patient/${patientId}/evolution/${encodeURIComponent(markerName)}${suffix}`,
		{ method: "GET" }
	);
}

export async function getPatientMarkerNames(patientId: string): Promise<{ names: string[] }> {
	return request<{ names: string[] }>(`/exams/patient/${patientId}/markers`, { method: "GET" });
}
