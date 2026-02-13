import { serverSideEnv } from "@/lib/env/server-side";
import { auth } from "@clerk/nextjs/server";
import { Environment, Local, PreviewEnv } from "./encore-client";

export type PrescriptionStatus = "draft" | "signed" | "cancelled";
export type PrescriptionItemType = "supplement" | "medication" | "orientation";

export interface PrescriptionItem {
	id: string;
	type: PrescriptionItemType;
	name: string;
	dosage: string;
	frequency: string;
	duration: string;
	instructions?: string;
}

export interface Prescription {
	id: string;
	patientId: string;
	organizationId: string;
	diagnosisId?: string;
	status: PrescriptionStatus;
	items: PrescriptionItem[];
	notes?: string;
	validUntil?: string;
	createdBy: string;
	signedBy?: string;
	signedAt?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreatePrescriptionParams {
	patientId: string;
	diagnosisId?: string;
	items: Omit<PrescriptionItem, "id">[];
	notes?: string;
	validUntil?: string;
}

export interface ListPrescriptionsParams {
	patientId?: string;
	status?: PrescriptionStatus;
	limit?: number;
	offset?: number;
}

export interface ListPrescriptionsResponse {
	items: Prescription[];
	total: number;
}

export interface UpdatePrescriptionParams {
	id: string;
	items?: Omit<PrescriptionItem, "id">[];
	notes?: string;
	validUntil?: string;
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
		throw new Error(`Prescription API error ${res.status}: ${message}`);
	}

	return (await res.json()) as T;
}

export async function createPrescription(
	params: CreatePrescriptionParams,
): Promise<Prescription> {
	return request<Prescription>("/prescriptions", {
		method: "POST",
		body: JSON.stringify(params),
	});
}

export async function listPrescriptions(
	params: ListPrescriptionsParams = {},
): Promise<ListPrescriptionsResponse> {
	const q = new URLSearchParams();
	if (params.patientId) q.set("patientId", params.patientId);
	if (params.status) q.set("status", params.status);
	if (params.limit !== undefined) q.set("limit", String(params.limit));
	if (params.offset !== undefined) q.set("offset", String(params.offset));

	const suffix = q.toString() ? `?${q.toString()}` : "";
	return request<ListPrescriptionsResponse>(`/prescriptions${suffix}`, {
		method: "GET",
	});
}

export async function getPrescription(id: string): Promise<Prescription> {
	return request<Prescription>(`/prescriptions/${id}`, { method: "GET" });
}

export async function updatePrescription(
	params: UpdatePrescriptionParams,
): Promise<Prescription> {
	return request<Prescription>(`/prescriptions/${params.id}`, {
		method: "PUT",
		body: JSON.stringify(params),
	});
}

export async function signPrescription(id: string): Promise<Prescription> {
	return request<Prescription>(`/prescriptions/${id}/sign`, {
		method: "POST",
		body: JSON.stringify({ id }),
	});
}

export async function cancelPrescription(
	id: string,
	reason?: string,
): Promise<Prescription> {
	return request<Prescription>(`/prescriptions/${id}/cancel`, {
		method: "POST",
		body: JSON.stringify({ id, reason }),
	});
}

