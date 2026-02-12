import { APIError, api } from "encore.dev/api";
import log from "encore.dev/log";
import { randomUUID } from "node:crypto";
import { getAuthData } from "~encore/auth";
import { db } from "./db";

type PatientStatus = "active" | "inactive" | "archived";
type PatientGender = "male" | "female" | "other";

interface PatientRow {
	id: string;
	organization_id: string;
	name: string;
	cpf: string;
	email: string | null;
	phone: string;
	birth_date: string;
	gender: PatientGender;
	status: PatientStatus;
	created_at: Date;
	updated_at: Date;
	archived_at: Date | null;
}

interface Patient {
	id: string;
	organizationId: string;
	name: string;
	cpf: string;
	email?: string;
	phone: string;
	birthDate: string;
	gender: PatientGender;
	status: PatientStatus;
	createdAt: Date;
	updatedAt: Date;
	archivedAt?: Date;
}

interface CreatePatientParams {
	name: string;
	cpf: string;
	email?: string;
	phone: string;
	birthDate: string;
	gender: PatientGender;
}

interface ListPatientsParams {
	search?: string;
	status?: PatientStatus;
	limit?: number;
	offset?: number;
}

interface ListPatientsResponse {
	items: Patient[];
	total: number;
}

interface GetPatientParams {
	id: string;
}

interface UpdatePatientParams {
	id: string;
	name?: string;
	cpf?: string;
	email?: string | null;
	phone?: string;
	birthDate?: string;
	gender?: PatientGender;
	status?: PatientStatus;
}

interface ArchivePatientParams {
	id: string;
}

function toPatient(row: PatientRow): Patient {
	return {
		id: row.id,
		organizationId: row.organization_id,
		name: row.name,
		cpf: row.cpf,
		email: row.email ?? undefined,
		phone: row.phone,
		birthDate: row.birth_date,
		gender: row.gender,
		status: row.status,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		archivedAt: row.archived_at ?? undefined,
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
	if (!limit || limit <= 0) {
		return 20;
	}
	return Math.min(limit, 100);
}

function normalizeOffset(offset?: number): number {
	if (!offset || offset < 0) {
		return 0;
	}
	return offset;
}

// Creates a patient for the authenticated organization.
export const createPatient = api(
	{ method: "POST", path: "/patients", expose: true, auth: true },
	async (params: CreatePatientParams): Promise<Patient> => {
		const authData = requireAuthContext();
		const id = randomUUID();

		try {
			const row = await db.queryRow<PatientRow>`
				INSERT INTO patients (
					id,
					organization_id,
					name,
					cpf,
					email,
					phone,
					birth_date,
					gender,
					status
				) VALUES (
					${id},
					${authData.orgID},
					${params.name.trim()},
					${params.cpf.trim()},
					${params.email?.trim() || null},
					${params.phone.trim()},
					${params.birthDate},
					${params.gender},
					${"active"}
				)
				RETURNING *
			`;

			if (!row) {
				throw APIError.internal("failed to create patient");
			}

			log.info("patient created", {
				patientID: row.id,
				orgID: authData.orgID,
				userID: authData.userID,
			});

			return toPatient(row);
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes("patients_org_cpf_unique")
			) {
				throw APIError.alreadyExists("a patient with this CPF already exists");
			}
			throw error;
		}
	},
);

// Lists patients for the authenticated organization.
export const listPatients = api(
	{ method: "GET", path: "/patients", expose: true, auth: true },
	async (params: ListPatientsParams): Promise<ListPatientsResponse> => {
		const authData = requireAuthContext();
		const limit = normalizeLimit(params.limit);
		const offset = normalizeOffset(params.offset);
		const search = params.search?.trim();
		const status = params.status;
		const searchPattern = search ? `%${search}%` : null;

		const items: Patient[] = [];
		for await (const row of db.query<PatientRow>`
			SELECT *
			FROM patients
			WHERE organization_id = ${authData.orgID}
			  AND (${status || null}::TEXT IS NULL OR status = ${status || null})
			  AND (
				${searchPattern}::TEXT IS NULL
				OR name ILIKE ${searchPattern}
				OR cpf ILIKE ${searchPattern}
			  )
			ORDER BY created_at DESC
			LIMIT ${limit}
			OFFSET ${offset}
		`) {
			items.push(toPatient(row));
		}

		const totalRow = await db.queryRow<{ count: number }>`
			SELECT COUNT(*)::INT AS count
			FROM patients
			WHERE organization_id = ${authData.orgID}
			  AND (${status || null}::TEXT IS NULL OR status = ${status || null})
			  AND (
				${searchPattern}::TEXT IS NULL
				OR name ILIKE ${searchPattern}
				OR cpf ILIKE ${searchPattern}
			  )
		`;

		return {
			items,
			total: totalRow?.count ?? 0,
		};
	},
);

// Returns a patient by id in the authenticated organization.
export const getPatient = api(
	{ method: "GET", path: "/patients/:id", expose: true, auth: true },
	async ({ id }: GetPatientParams): Promise<Patient> => {
		const authData = requireAuthContext();

		const row = await db.queryRow<PatientRow>`
			SELECT *
			FROM patients
			WHERE id = ${id}
			  AND organization_id = ${authData.orgID}
		`;

		if (!row) {
			throw APIError.notFound("patient not found");
		}

		return toPatient(row);
	},
);

// Updates patient fields in the authenticated organization.
export const updatePatient = api(
	{ method: "PUT", path: "/patients/:id", expose: true, auth: true },
	async (params: UpdatePatientParams): Promise<Patient> => {
		const authData = requireAuthContext();

		const row = await db.queryRow<PatientRow>`
			UPDATE patients
			SET
				name = COALESCE(${params.name?.trim() || null}, name),
				cpf = COALESCE(${params.cpf?.trim() || null}, cpf),
				email = COALESCE(${params.email === undefined ? null : params.email}, email),
				phone = COALESCE(${params.phone?.trim() || null}, phone),
				birth_date = COALESCE(${params.birthDate || null}, birth_date),
				gender = COALESCE(${params.gender || null}, gender),
				status = COALESCE(${params.status || null}, status),
				updated_at = NOW()
			WHERE id = ${params.id}
			  AND organization_id = ${authData.orgID}
			RETURNING *
		`;

		if (!row) {
			throw APIError.notFound("patient not found");
		}

		log.info("patient updated", {
			patientID: row.id,
			orgID: authData.orgID,
			userID: authData.userID,
		});

		return toPatient(row);
	},
);

// Archives a patient in the authenticated organization.
export const archivePatient = api(
	{ method: "POST", path: "/patients/:id/archive", expose: true, auth: true },
	async ({ id }: ArchivePatientParams): Promise<Patient> => {
		const authData = requireAuthContext();

		const row = await db.queryRow<PatientRow>`
			UPDATE patients
			SET
				status = ${"archived"},
				archived_at = NOW(),
				updated_at = NOW()
			WHERE id = ${id}
			  AND organization_id = ${authData.orgID}
			RETURNING *
		`;

		if (!row) {
			throw APIError.notFound("patient not found");
		}

		log.info("patient archived", {
			patientID: row.id,
			orgID: authData.orgID,
			userID: authData.userID,
		});

		return toPatient(row);
	},
);
