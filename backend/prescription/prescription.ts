import { APIError, api } from "encore.dev/api";
import log from "encore.dev/log";
import { randomUUID } from "node:crypto";
import { getDiagnosis } from "../diagnosis/diagnosis";
import { getPatient, recordSystemTimelineEvent } from "../patients/patients";
import { getAuthData } from "~encore/auth";
import { db } from "./db";

type PrescriptionStatus = "draft" | "signed" | "cancelled";
type PrescriptionItemType = "supplement" | "medication" | "orientation";

interface PrescriptionItem {
	id: string;
	type: PrescriptionItemType;
	name: string;
	dosage: string;
	frequency: string;
	duration: string;
	instructions?: string;
}

interface PrescriptionRow {
	id: string;
	patient_id: string;
	organization_id: string;
	diagnosis_id: string | null;
	status: PrescriptionStatus;
	items: PrescriptionItem[];
	notes: string | null;
	valid_until: string | null;
	created_by: string;
	signed_by: string | null;
	signed_at: Date | null;
	created_at: Date;
	updated_at: Date;
}

interface Prescription {
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
	signedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

interface CreatePrescriptionParams {
	patientId: string;
	diagnosisId?: string;
	items: Omit<PrescriptionItem, "id">[];
	notes?: string;
	validUntil?: string;
}

interface ListPrescriptionsParams {
	patientId?: string;
	status?: PrescriptionStatus;
	limit?: number;
	offset?: number;
}

interface ListPrescriptionsResponse {
	items: Prescription[];
	total: number;
}

interface UpdatePrescriptionParams {
	id: string;
	items?: Omit<PrescriptionItem, "id">[];
	notes?: string;
	validUntil?: string;
}

interface SignPrescriptionParams {
	id: string;
}

interface CancelPrescriptionParams {
	id: string;
	reason?: string;
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

function normalizeItems(items: Omit<PrescriptionItem, "id">[]): PrescriptionItem[] {
	return items.map((item) => ({
		id: randomUUID(),
		type: item.type,
		name: item.name.trim(),
		dosage: item.dosage.trim(),
		frequency: item.frequency.trim(),
		duration: item.duration.trim(),
		instructions: item.instructions?.trim() || undefined,
	}));
}

function toPrescription(row: PrescriptionRow): Prescription {
	return {
		id: row.id,
		patientId: row.patient_id,
		organizationId: row.organization_id,
		diagnosisId: row.diagnosis_id ?? undefined,
		status: row.status,
		items: row.items || [],
		notes: row.notes ?? undefined,
		validUntil: row.valid_until ?? undefined,
		createdBy: row.created_by,
		signedBy: row.signed_by ?? undefined,
		signedAt: row.signed_at ?? undefined,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

async function safeRecordTimelineEvent(params: {
	patientId: string;
	organizationId: string;
	eventType: "prescription_created" | "status_changed";
	title: string;
	description?: string;
	metadata?: Record<string, unknown>;
	actorId?: string;
}): Promise<void> {
	try {
		await recordSystemTimelineEvent(params);
	} catch (error) {
		log.warn("failed to append prescription timeline event", { error, params });
	}
}

async function verifyPrescriptionInOrg(
	id: string,
	orgID: string,
): Promise<PrescriptionRow> {
	const row = await db.queryRow<PrescriptionRow>`
		SELECT *
		FROM prescriptions
		WHERE id = ${id}
		  AND organization_id = ${orgID}
	`;

	if (!row) {
		throw APIError.notFound("prescription not found");
	}

	return row;
}

// Create a prescription draft.
export const createPrescription = api(
	{ method: "POST", path: "/prescriptions", expose: true, auth: true },
	async (params: CreatePrescriptionParams): Promise<Prescription> => {
		const authData = requireAuthContext();

		if (!params.items || params.items.length === 0) {
			throw APIError.invalidArgument("at least one prescription item is required");
		}

		await getPatient({ id: params.patientId });
		if (params.diagnosisId) {
			const diagnosis = await getDiagnosis({ id: params.diagnosisId });
			if (diagnosis.patientId !== params.patientId) {
				throw APIError.invalidArgument(
					"diagnosis does not belong to informed patient",
				);
			}
		}

		const id = randomUUID();
		const items = normalizeItems(params.items);
		const row = await db.queryRow<PrescriptionRow>`
			INSERT INTO prescriptions (
				id,
				patient_id,
				organization_id,
				diagnosis_id,
				status,
				items,
				notes,
				valid_until,
				created_by
			) VALUES (
				${id},
				${params.patientId},
				${authData.orgID},
				${params.diagnosisId || null},
				${"draft"},
				${JSON.stringify(items)}::JSONB,
				${params.notes?.trim() || null},
				${params.validUntil || null},
				${authData.userID}
			)
			RETURNING *
		`;

		if (!row) {
			throw APIError.internal("failed to create prescription");
		}

		await safeRecordTimelineEvent({
			patientId: row.patient_id,
			organizationId: authData.orgID,
			eventType: "prescription_created",
			title: "Prescription created",
			description: `${items.length} item(s) added to draft.`,
			metadata: {
				prescriptionId: row.id,
				status: row.status,
				itemsCount: items.length,
			},
			actorId: authData.userID,
		});

		log.info("prescription created", {
			prescriptionID: row.id,
			patientID: row.patient_id,
			orgID: authData.orgID,
			userID: authData.userID,
		});

		return toPrescription(row);
	},
);

// List prescriptions from organization with optional filters.
export const listPrescriptions = api(
	{ method: "GET", path: "/prescriptions", expose: true, auth: true },
	async (params: ListPrescriptionsParams): Promise<ListPrescriptionsResponse> => {
		const authData = requireAuthContext();
		const limit = normalizeLimit(params.limit);
		const offset = normalizeOffset(params.offset);

		const items: Prescription[] = [];
		for await (const row of db.query<PrescriptionRow>`
			SELECT *
			FROM prescriptions
			WHERE organization_id = ${authData.orgID}
			  AND (${params.patientId || null}::TEXT IS NULL OR patient_id = ${params.patientId || null})
			  AND (${params.status || null}::TEXT IS NULL OR status = ${params.status || null})
			ORDER BY created_at DESC
			LIMIT ${limit}
			OFFSET ${offset}
		`) {
			items.push(toPrescription(row));
		}

		const totalRow = await db.queryRow<{ count: number }>`
			SELECT COUNT(*)::INT AS count
			FROM prescriptions
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

// Get prescription details by id.
export const getPrescription = api(
	{ method: "GET", path: "/prescriptions/:id", expose: true, auth: true },
	async ({ id }: { id: string }): Promise<Prescription> => {
		const authData = requireAuthContext();
		const row = await verifyPrescriptionInOrg(id, authData.orgID);
		return toPrescription(row);
	},
);

// Update a prescription draft.
export const updatePrescription = api(
	{ method: "PUT", path: "/prescriptions/:id", expose: true, auth: true },
	async (params: UpdatePrescriptionParams): Promise<Prescription> => {
		const authData = requireAuthContext();
		const existing = await verifyPrescriptionInOrg(params.id, authData.orgID);

		if (existing.status !== "draft") {
			throw APIError.failedPrecondition("only draft prescriptions can be updated");
		}

		const items =
			params.items && params.items.length > 0
				? normalizeItems(params.items)
				: undefined;

		const row = await db.queryRow<PrescriptionRow>`
			UPDATE prescriptions
			SET
				items = COALESCE(${items ? JSON.stringify(items) : null}::JSONB, items),
				notes = COALESCE(${params.notes?.trim() || null}, notes),
				valid_until = COALESCE(${params.validUntil || null}, valid_until),
				updated_at = NOW()
			WHERE id = ${params.id}
			  AND organization_id = ${authData.orgID}
			RETURNING *
		`;

		if (!row) {
			throw APIError.notFound("prescription not found");
		}

		return toPrescription(row);
	},
);

// Mark prescription as signed.
export const signPrescription = api(
	{ method: "POST", path: "/prescriptions/:id/sign", expose: true, auth: true },
	async (params: SignPrescriptionParams): Promise<Prescription> => {
		const authData = requireAuthContext();
		const existing = await verifyPrescriptionInOrg(params.id, authData.orgID);

		if (existing.status !== "draft") {
			throw APIError.failedPrecondition("only draft prescriptions can be signed");
		}

		const row = await db.queryRow<PrescriptionRow>`
			UPDATE prescriptions
			SET
				status = ${"signed"},
				signed_by = ${authData.userID},
				signed_at = NOW(),
				updated_at = NOW()
			WHERE id = ${params.id}
			  AND organization_id = ${authData.orgID}
			RETURNING *
		`;

		if (!row) {
			throw APIError.notFound("prescription not found");
		}

		await safeRecordTimelineEvent({
			patientId: row.patient_id,
			organizationId: authData.orgID,
			eventType: "status_changed",
			title: "Prescription signed",
			description: "Prescription moved from draft to signed.",
			metadata: {
				prescriptionId: row.id,
				fromStatus: existing.status,
				toStatus: row.status,
			},
			actorId: authData.userID,
		});

		log.info("prescription signed", {
			prescriptionID: row.id,
			patientID: row.patient_id,
			orgID: authData.orgID,
			userID: authData.userID,
		});

		return toPrescription(row);
	},
);

// Cancel a prescription.
export const cancelPrescription = api(
	{ method: "POST", path: "/prescriptions/:id/cancel", expose: true, auth: true },
	async (params: CancelPrescriptionParams): Promise<Prescription> => {
		const authData = requireAuthContext();
		const existing = await verifyPrescriptionInOrg(params.id, authData.orgID);

		if (existing.status === "cancelled") {
			throw APIError.failedPrecondition("prescription is already cancelled");
		}

		const row = await db.queryRow<PrescriptionRow>`
			UPDATE prescriptions
			SET
				status = ${"cancelled"},
				updated_at = NOW()
			WHERE id = ${params.id}
			  AND organization_id = ${authData.orgID}
			RETURNING *
		`;

		if (!row) {
			throw APIError.notFound("prescription not found");
		}

		await safeRecordTimelineEvent({
			patientId: row.patient_id,
			organizationId: authData.orgID,
			eventType: "status_changed",
			title: "Prescription cancelled",
			description: params.reason?.trim() || "Prescription was cancelled.",
			metadata: {
				prescriptionId: row.id,
				fromStatus: existing.status,
				toStatus: row.status,
			},
			actorId: authData.userID,
		});

		log.info("prescription cancelled", {
			prescriptionID: row.id,
			patientID: row.patient_id,
			orgID: authData.orgID,
			userID: authData.userID,
		});

		return toPrescription(row);
	},
);

