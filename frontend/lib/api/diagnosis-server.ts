import { serverSideEnv } from "@/lib/env/server-side";
import { auth } from "@clerk/nextjs/server";
import { Environment, Local, PreviewEnv } from "./encore-client";

export type DiagnosisStatus = "draft" | "reviewed";
export type DiagnosisSeverity = "low" | "medium" | "high";

export interface DiagnosisCondition {
	name: string;
	probability: number;
	severity: DiagnosisSeverity;
	supportingEvidence: string[];
	contradictingEvidence: string[];
}

export interface DiagnosisRecord {
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
	reviewedAt?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ListDiagnosesParams {
	patientId?: string;
	status?: DiagnosisStatus;
	limit?: number;
	offset?: number;
}

export interface ListDiagnosesResponse {
	items: DiagnosisRecord[];
	total: number;
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
		throw new Error(`Diagnosis API error ${res.status}: ${message}`);
	}

	return (await res.json()) as T;
}

export async function analyzePatientDiagnosis(patientId: string): Promise<DiagnosisRecord> {
	return request<DiagnosisRecord>("/diagnosis/analyze", {
		method: "POST",
		body: JSON.stringify({ patientId }),
	});
}

export async function listDiagnoses(
	params: ListDiagnosesParams = {},
): Promise<ListDiagnosesResponse> {
	const q = new URLSearchParams();
	if (params.patientId) q.set("patientId", params.patientId);
	if (params.status) q.set("status", params.status);
	if (params.limit !== undefined) q.set("limit", String(params.limit));
	if (params.offset !== undefined) q.set("offset", String(params.offset));

	const suffix = q.toString() ? `?${q.toString()}` : "";
	return request<ListDiagnosesResponse>(`/diagnosis${suffix}`, {
		method: "GET",
	});
}

export async function getDiagnosis(id: string): Promise<DiagnosisRecord> {
	return request<DiagnosisRecord>(`/diagnosis/${id}`, { method: "GET" });
}

export async function reviewDiagnosis(
	id: string,
	clinicalNotes?: string,
): Promise<DiagnosisRecord> {
	return request<DiagnosisRecord>(`/diagnosis/${id}/review`, {
		method: "PUT",
		body: JSON.stringify({ id, clinicalNotes }),
	});
}

