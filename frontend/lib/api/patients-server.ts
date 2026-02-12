import { serverSideEnv } from "@/lib/env/server-side";
import { auth } from "@clerk/nextjs/server";
import { Environment, Local, PreviewEnv } from "./encore-client";

export type PatientStatus = "active" | "inactive" | "archived";
export type PatientGender = "male" | "female" | "other";

export interface Patient {
	id: string;
	organizationId: string;
	name: string;
	cpf: string;
	email?: string;
	phone: string;
	birthDate: string;
	gender: PatientGender;
	status: PatientStatus;
	createdAt: string;
	updatedAt: string;
	archivedAt?: string;
}

export interface ListPatientsParams {
	search?: string;
	status?: PatientStatus;
	limit?: number;
	offset?: number;
}

export interface ListPatientsResponse {
	items: Patient[];
	total: number;
}

export interface CreatePatientParams {
	name: string;
	cpf: string;
	email?: string;
	phone: string;
	birthDate: string;
	gender: PatientGender;
}

export interface UpdatePatientParams {
	id: string;
	name?: string;
	cpf?: string;
	email?: string;
	phone?: string;
	birthDate?: string;
	gender?: PatientGender;
	status?: PatientStatus;
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
	const { getToken } = await auth();
	const token = await getToken();

	if (!token) {
		throw new Error("Missing Clerk token in server request");
	}

	const res = await fetch(`${getEncoreBaseUrl()}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
			...(init?.headers || {}),
		},
		cache: "no-store",
	});

	if (!res.ok) {
		const message = await res.text();
		throw new Error(`Patients API error ${res.status}: ${message}`);
	}

	return (await res.json()) as T;
}

export async function listPatients(
	params: ListPatientsParams = {},
): Promise<ListPatientsResponse> {
	const q = new URLSearchParams();

	if (params.search) {
		q.set("search", params.search);
	}
	if (params.status) {
		q.set("status", params.status);
	}
	if (params.limit !== undefined) {
		q.set("limit", String(params.limit));
	}
	if (params.offset !== undefined) {
		q.set("offset", String(params.offset));
	}

	const suffix = q.toString() ? `?${q.toString()}` : "";
	return request<ListPatientsResponse>(`/patients${suffix}`, {
		method: "GET",
	});
}

export async function createPatient(params: CreatePatientParams): Promise<Patient> {
	return request<Patient>("/patients", {
		method: "POST",
		body: JSON.stringify(params),
	});
}

export async function getPatient(id: string): Promise<Patient> {
	return request<Patient>(`/patients/${id}`, { method: "GET" });
}

export async function updatePatient(params: UpdatePatientParams): Promise<Patient> {
	return request<Patient>(`/patients/${params.id}`, {
		method: "PUT",
		body: JSON.stringify(params),
	});
}

export async function archivePatient(id: string): Promise<Patient> {
	return request<Patient>(`/patients/${id}/archive`, {
		method: "POST",
		body: JSON.stringify({ id }),
	});
}
