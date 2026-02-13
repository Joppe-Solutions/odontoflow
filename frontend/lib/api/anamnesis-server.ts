import { serverSideEnv } from "@/lib/env/server-side";
import { auth } from "@clerk/nextjs/server";
import { Environment, Local, PreviewEnv } from "./encore-client";

// Types
export type SubmissionStatus = "pending" | "in_progress" | "completed" | "expired";

export type QuestionType =
	| "text"
	| "textarea"
	| "number"
	| "date"
	| "select"
	| "multiselect"
	| "radio"
	| "checkbox"
	| "scale";

export interface Question {
	id: string;
	type: QuestionType;
	label: string;
	description?: string;
	required: boolean;
	options?: string[];
	min?: number;
	max?: number;
	conditionalOn?: {
		questionId: string;
		value: string | string[];
	};
}

export interface Section {
	id: string;
	title: string;
	description?: string;
	questions: Question[];
}

export interface AnamnesisTemplate {
	id: string;
	organizationId: string;
	name: string;
	description?: string;
	sections: Section[];
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface AnamnesisSubmission {
	id: string;
	templateId: string;
	patientId: string;
	organizationId: string;
	token: string;
	status: SubmissionStatus;
	responses?: Record<string, unknown>;
	expiresAt: string;
	startedAt?: string;
	submittedAt?: string;
	createdAt: string;
}

export interface CreateTemplateParams {
	name: string;
	description?: string;
	sections: Section[];
}

export interface UpdateTemplateParams {
	id: string;
	name?: string;
	description?: string;
	sections?: Section[];
	isActive?: boolean;
}

export interface ListTemplatesParams {
	activeOnly?: boolean;
	limit?: number;
	offset?: number;
}

export interface ListTemplatesResponse {
	items: AnamnesisTemplate[];
	total: number;
}

export interface CreateSubmissionParams {
	templateId: string;
	patientId: string;
	expiresInHours?: number;
}

export interface ListSubmissionsParams {
	patientId?: string;
	status?: SubmissionStatus;
	limit?: number;
	offset?: number;
}

export interface ListSubmissionsResponse {
	items: AnamnesisSubmission[];
	total: number;
}

export interface PublicFormData {
	submission: {
		id: string;
		status: SubmissionStatus;
		expiresAt: string;
		responses?: Record<string, unknown>;
	};
	template: {
		name: string;
		description?: string;
		sections: Section[];
	};
}

function getEncoreBaseUrl(): string {
	if (serverSideEnv.ENCORE_ENV_NAME) {
		return Environment(serverSideEnv.ENCORE_ENV_NAME);
	}
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
		throw new Error(`Anamnesis API error ${res.status}: ${message}`);
	}

	return (await res.json()) as T;
}

// Public request (no auth)
async function publicRequest<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${getEncoreBaseUrl()}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(init?.headers || {}),
		},
		cache: "no-store",
	});

	if (!res.ok) {
		const message = await res.text();
		throw new Error(`Anamnesis API error ${res.status}: ${message}`);
	}

	return (await res.json()) as T;
}

// Template APIs
export async function createTemplate(params: CreateTemplateParams): Promise<AnamnesisTemplate> {
	return request<AnamnesisTemplate>("/anamnesis/templates", {
		method: "POST",
		body: JSON.stringify(params),
	});
}

export async function listTemplates(params: ListTemplatesParams = {}): Promise<ListTemplatesResponse> {
	const q = new URLSearchParams();
	if (params.activeOnly) q.set("activeOnly", "true");
	if (params.limit !== undefined) q.set("limit", String(params.limit));
	if (params.offset !== undefined) q.set("offset", String(params.offset));

	const suffix = q.toString() ? `?${q.toString()}` : "";
	return request<ListTemplatesResponse>(`/anamnesis/templates${suffix}`, { method: "GET" });
}

export async function getTemplate(id: string): Promise<AnamnesisTemplate> {
	return request<AnamnesisTemplate>(`/anamnesis/templates/${id}`, { method: "GET" });
}

export async function updateTemplate(params: UpdateTemplateParams): Promise<AnamnesisTemplate> {
	return request<AnamnesisTemplate>(`/anamnesis/templates/${params.id}`, {
		method: "PUT",
		body: JSON.stringify(params),
	});
}

// Submission APIs
export async function createSubmission(params: CreateSubmissionParams): Promise<AnamnesisSubmission> {
	return request<AnamnesisSubmission>("/anamnesis/submissions", {
		method: "POST",
		body: JSON.stringify(params),
	});
}

export async function listSubmissions(params: ListSubmissionsParams = {}): Promise<ListSubmissionsResponse> {
	const q = new URLSearchParams();
	if (params.patientId) q.set("patientId", params.patientId);
	if (params.status) q.set("status", params.status);
	if (params.limit !== undefined) q.set("limit", String(params.limit));
	if (params.offset !== undefined) q.set("offset", String(params.offset));

	const suffix = q.toString() ? `?${q.toString()}` : "";
	return request<ListSubmissionsResponse>(`/anamnesis/submissions${suffix}`, { method: "GET" });
}

export async function getPatientSubmissions(patientId: string): Promise<ListSubmissionsResponse> {
	return request<ListSubmissionsResponse>(`/anamnesis/patient/${patientId}`, { method: "GET" });
}

// Public APIs (for patient forms)
export async function getFormByToken(token: string): Promise<PublicFormData> {
	return publicRequest<PublicFormData>(`/anamnesis/form/${token}`, { method: "GET" });
}

export async function submitForm(token: string, responses: Record<string, unknown>): Promise<{ success: boolean }> {
	return publicRequest<{ success: boolean }>(`/anamnesis/form/${token}/submit`, {
		method: "POST",
		body: JSON.stringify({ token, responses }),
	});
}

export async function saveDraft(token: string, responses: Record<string, unknown>): Promise<{ success: boolean }> {
	return publicRequest<{ success: boolean }>(`/anamnesis/form/${token}/draft`, {
		method: "PUT",
		body: JSON.stringify({ token, responses }),
	});
}
