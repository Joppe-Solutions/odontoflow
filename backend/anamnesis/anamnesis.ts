import { APIError, api } from "encore.dev/api";
import log from "encore.dev/log";
import { randomUUID } from "node:crypto";
import { getAuthData } from "~encore/auth";
import { db } from "./db";

// Types
type SubmissionStatus = "pending" | "in_progress" | "completed" | "expired";

type QuestionType =
	| "text"
	| "textarea"
	| "number"
	| "date"
	| "select"
	| "multiselect"
	| "radio"
	| "checkbox"
	| "scale";

interface Question {
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

interface Section {
	id: string;
	title: string;
	description?: string;
	questions: Question[];
}

// Row types
interface TemplateRow {
	id: string;
	organization_id: string;
	name: string;
	description: string | null;
	sections: Section[];
	is_active: boolean;
	created_at: Date;
	updated_at: Date;
}

interface SubmissionRow {
	id: string;
	template_id: string;
	patient_id: string;
	organization_id: string;
	token: string;
	status: SubmissionStatus;
	responses: Record<string, unknown> | null;
	expires_at: Date;
	started_at: Date | null;
	submitted_at: Date | null;
	created_at: Date;
}

// API types
interface AnamnesisTemplate {
	id: string;
	organizationId: string;
	name: string;
	description?: string;
	sections: Section[];
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

interface AnamnesisSubmission {
	id: string;
	templateId: string;
	patientId: string;
	organizationId: string;
	token: string;
	status: SubmissionStatus;
	responses?: Record<string, unknown>;
	expiresAt: Date;
	startedAt?: Date;
	submittedAt?: Date;
	createdAt: Date;
}

// Params
interface CreateTemplateParams {
	name: string;
	description?: string;
	sections: Section[];
}

interface UpdateTemplateParams {
	id: string;
	name?: string;
	description?: string;
	sections?: Section[];
	isActive?: boolean;
}

interface ListTemplatesParams {
	activeOnly?: boolean;
	limit?: number;
	offset?: number;
}

interface ListTemplatesResponse {
	items: AnamnesisTemplate[];
	total: number;
}

interface CreateSubmissionParams {
	templateId: string;
	patientId: string;
	expiresInHours?: number;
}

interface ListSubmissionsParams {
	patientId?: string;
	status?: SubmissionStatus;
	limit?: number;
	offset?: number;
}

interface ListSubmissionsResponse {
	items: AnamnesisSubmission[];
	total: number;
}

interface GetSubmissionByTokenParams {
	token: string;
}

interface SubmitFormParams {
	token: string;
	responses: Record<string, unknown>;
}

interface PublicFormData {
	submission: {
		id: string;
		status: SubmissionStatus;
		expiresAt: Date;
		responses?: Record<string, unknown>;
	};
	template: {
		name: string;
		description?: string;
		sections: Section[];
	};
}

// Converters
function toTemplate(row: TemplateRow): AnamnesisTemplate {
	return {
		id: row.id,
		organizationId: row.organization_id,
		name: row.name,
		description: row.description ?? undefined,
		sections: row.sections,
		isActive: row.is_active,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function toSubmission(row: SubmissionRow): AnamnesisSubmission {
	return {
		id: row.id,
		templateId: row.template_id,
		patientId: row.patient_id,
		organizationId: row.organization_id,
		token: row.token,
		status: row.status,
		responses: row.responses ?? undefined,
		expiresAt: row.expires_at,
		startedAt: row.started_at ?? undefined,
		submittedAt: row.submitted_at ?? undefined,
		createdAt: row.created_at,
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

function generateToken(): string {
	return `anm_${randomUUID().replace(/-/g, "")}`;
}

// ============ TEMPLATE ENDPOINTS ============

// Create a new anamnesis template
export const createTemplate = api(
	{ method: "POST", path: "/anamnesis/templates", expose: true, auth: true },
	async (params: CreateTemplateParams): Promise<AnamnesisTemplate> => {
		const authData = requireAuthContext();
		const id = randomUUID();

		const row = await db.queryRow<TemplateRow>`
			INSERT INTO anamnesis_templates (
				id, organization_id, name, description, sections
			) VALUES (
				${id},
				${authData.orgID},
				${params.name.trim()},
				${params.description?.trim() || null},
				${JSON.stringify(params.sections)}::JSONB
			)
			RETURNING *
		`;

		if (!row) {
			throw APIError.internal("failed to create template");
		}

		log.info("anamnesis template created", {
			templateID: row.id,
			orgID: authData.orgID,
			userID: authData.userID,
		});

		return toTemplate(row);
	},
);

// List templates for the organization
export const listTemplates = api(
	{ method: "GET", path: "/anamnesis/templates", expose: true, auth: true },
	async (params: ListTemplatesParams): Promise<ListTemplatesResponse> => {
		const authData = requireAuthContext();
		const limit = normalizeLimit(params.limit);
		const offset = normalizeOffset(params.offset);
		const activeOnly = params.activeOnly ?? false;

		const items: AnamnesisTemplate[] = [];
		for await (const row of db.query<TemplateRow>`
			SELECT * FROM anamnesis_templates
			WHERE organization_id = ${authData.orgID}
			  AND (${!activeOnly} OR is_active = true)
			ORDER BY created_at DESC
			LIMIT ${limit} OFFSET ${offset}
		`) {
			items.push(toTemplate(row));
		}

		const totalRow = await db.queryRow<{ count: number }>`
			SELECT COUNT(*)::INT AS count
			FROM anamnesis_templates
			WHERE organization_id = ${authData.orgID}
			  AND (${!activeOnly} OR is_active = true)
		`;

		return { items, total: totalRow?.count ?? 0 };
	},
);

// Get a single template
export const getTemplate = api(
	{ method: "GET", path: "/anamnesis/templates/:id", expose: true, auth: true },
	async ({ id }: { id: string }): Promise<AnamnesisTemplate> => {
		const authData = requireAuthContext();

		const row = await db.queryRow<TemplateRow>`
			SELECT * FROM anamnesis_templates
			WHERE id = ${id} AND organization_id = ${authData.orgID}
		`;

		if (!row) {
			throw APIError.notFound("template not found");
		}

		return toTemplate(row);
	},
);

// Update a template
export const updateTemplate = api(
	{ method: "PUT", path: "/anamnesis/templates/:id", expose: true, auth: true },
	async (params: UpdateTemplateParams): Promise<AnamnesisTemplate> => {
		const authData = requireAuthContext();

		const row = await db.queryRow<TemplateRow>`
			UPDATE anamnesis_templates
			SET
				name = COALESCE(${params.name?.trim() || null}, name),
				description = COALESCE(${params.description?.trim()}, description),
				sections = COALESCE(${params.sections ? JSON.stringify(params.sections) : null}::JSONB, sections),
				is_active = COALESCE(${params.isActive ?? null}, is_active),
				updated_at = NOW()
			WHERE id = ${params.id} AND organization_id = ${authData.orgID}
			RETURNING *
		`;

		if (!row) {
			throw APIError.notFound("template not found");
		}

		log.info("anamnesis template updated", {
			templateID: row.id,
			orgID: authData.orgID,
			userID: authData.userID,
		});

		return toTemplate(row);
	},
);

// ============ SUBMISSION ENDPOINTS ============

// Create a new submission (generate link for patient)
export const createSubmission = api(
	{ method: "POST", path: "/anamnesis/submissions", expose: true, auth: true },
	async (params: CreateSubmissionParams): Promise<AnamnesisSubmission> => {
		const authData = requireAuthContext();
		const id = randomUUID();
		const token = generateToken();
		const expiresInHours = params.expiresInHours ?? 72;

		// Verify template exists and belongs to org
		const template = await db.queryRow<TemplateRow>`
			SELECT * FROM anamnesis_templates
			WHERE id = ${params.templateId} AND organization_id = ${authData.orgID}
		`;

		if (!template) {
			throw APIError.notFound("template not found");
		}

		const row = await db.queryRow<SubmissionRow>`
			INSERT INTO anamnesis_submissions (
				id, template_id, patient_id, organization_id, token, expires_at
			) VALUES (
				${id},
				${params.templateId},
				${params.patientId},
				${authData.orgID},
				${token},
				NOW() + INTERVAL '1 hour' * ${expiresInHours}
			)
			RETURNING *
		`;

		if (!row) {
			throw APIError.internal("failed to create submission");
		}

		log.info("anamnesis submission created", {
			submissionID: row.id,
			templateID: params.templateId,
			patientID: params.patientId,
			orgID: authData.orgID,
			userID: authData.userID,
		});

		return toSubmission(row);
	},
);

// List submissions for the organization
export const listSubmissions = api(
	{ method: "GET", path: "/anamnesis/submissions", expose: true, auth: true },
	async (params: ListSubmissionsParams): Promise<ListSubmissionsResponse> => {
		const authData = requireAuthContext();
		const limit = normalizeLimit(params.limit);
		const offset = normalizeOffset(params.offset);

		const items: AnamnesisSubmission[] = [];
		for await (const row of db.query<SubmissionRow>`
			SELECT * FROM anamnesis_submissions
			WHERE organization_id = ${authData.orgID}
			  AND (${params.patientId || null}::TEXT IS NULL OR patient_id = ${params.patientId || null})
			  AND (${params.status || null}::TEXT IS NULL OR status = ${params.status || null})
			ORDER BY created_at DESC
			LIMIT ${limit} OFFSET ${offset}
		`) {
			items.push(toSubmission(row));
		}

		const totalRow = await db.queryRow<{ count: number }>`
			SELECT COUNT(*)::INT AS count
			FROM anamnesis_submissions
			WHERE organization_id = ${authData.orgID}
			  AND (${params.patientId || null}::TEXT IS NULL OR patient_id = ${params.patientId || null})
			  AND (${params.status || null}::TEXT IS NULL OR status = ${params.status || null})
		`;

		return { items, total: totalRow?.count ?? 0 };
	},
);

// Get submissions for a specific patient
export const getPatientSubmissions = api(
	{ method: "GET", path: "/anamnesis/patient/:patientId", expose: true, auth: true },
	async ({ patientId }: { patientId: string }): Promise<ListSubmissionsResponse> => {
		const authData = requireAuthContext();

		const items: AnamnesisSubmission[] = [];
		for await (const row of db.query<SubmissionRow>`
			SELECT * FROM anamnesis_submissions
			WHERE patient_id = ${patientId} AND organization_id = ${authData.orgID}
			ORDER BY created_at DESC
		`) {
			items.push(toSubmission(row));
		}

		return { items, total: items.length };
	},
);

// ============ PUBLIC ENDPOINTS (no auth required) ============

// Get submission by token (public - for patient form)
export const getSubmissionByToken = api(
	{ method: "GET", path: "/anamnesis/form/:token", expose: true, auth: false },
	async ({ token }: GetSubmissionByTokenParams): Promise<PublicFormData> => {
		const submission = await db.queryRow<SubmissionRow>`
			SELECT * FROM anamnesis_submissions
			WHERE token = ${token}
		`;

		if (!submission) {
			throw APIError.notFound("form not found");
		}

		// Check if expired
		if (new Date() > submission.expires_at) {
			if (submission.status !== "expired" && submission.status !== "completed") {
				await db.exec`
					UPDATE anamnesis_submissions
					SET status = 'expired'
					WHERE id = ${submission.id}
				`;
			}
			throw APIError.failedPrecondition("this form has expired");
		}

		// Check if already completed
		if (submission.status === "completed") {
			throw APIError.failedPrecondition("this form has already been submitted");
		}

		// Get template
		const template = await db.queryRow<TemplateRow>`
			SELECT * FROM anamnesis_templates WHERE id = ${submission.template_id}
		`;

		if (!template) {
			throw APIError.internal("template not found");
		}

		// Mark as in_progress if pending
		if (submission.status === "pending") {
			await db.exec`
				UPDATE anamnesis_submissions
				SET status = 'in_progress', started_at = NOW()
				WHERE id = ${submission.id}
			`;
		}

		return {
			submission: {
				id: submission.id,
				status: submission.status === "pending" ? "in_progress" : submission.status,
				expiresAt: submission.expires_at,
				responses: submission.responses ?? undefined,
			},
			template: {
				name: template.name,
				description: template.description ?? undefined,
				sections: template.sections,
			},
		};
	},
);

// Submit the form (public)
export const submitForm = api(
	{ method: "POST", path: "/anamnesis/form/:token/submit", expose: true, auth: false },
	async (params: SubmitFormParams): Promise<{ success: boolean }> => {
		const submission = await db.queryRow<SubmissionRow>`
			SELECT * FROM anamnesis_submissions
			WHERE token = ${params.token}
		`;

		if (!submission) {
			throw APIError.notFound("form not found");
		}

		if (new Date() > submission.expires_at) {
			throw APIError.failedPrecondition("this form has expired");
		}

		if (submission.status === "completed") {
			throw APIError.failedPrecondition("this form has already been submitted");
		}

		await db.exec`
			UPDATE anamnesis_submissions
			SET
				status = 'completed',
				responses = ${JSON.stringify(params.responses)}::JSONB,
				submitted_at = NOW()
			WHERE id = ${submission.id}
		`;

		log.info("anamnesis form submitted", {
			submissionID: submission.id,
			patientID: submission.patient_id,
			orgID: submission.organization_id,
		});

		return { success: true };
	},
);

// Save draft responses (public)
export const saveDraft = api(
	{ method: "PUT", path: "/anamnesis/form/:token/draft", expose: true, auth: false },
	async (params: SubmitFormParams): Promise<{ success: boolean }> => {
		const submission = await db.queryRow<SubmissionRow>`
			SELECT * FROM anamnesis_submissions
			WHERE token = ${params.token}
		`;

		if (!submission) {
			throw APIError.notFound("form not found");
		}

		if (new Date() > submission.expires_at) {
			throw APIError.failedPrecondition("this form has expired");
		}

		if (submission.status === "completed") {
			throw APIError.failedPrecondition("this form has already been submitted");
		}

		await db.exec`
			UPDATE anamnesis_submissions
			SET responses = ${JSON.stringify(params.responses)}::JSONB
			WHERE id = ${submission.id}
		`;

		return { success: true };
	},
);
