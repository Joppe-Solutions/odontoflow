-- Anamnesis form templates
CREATE TABLE anamnesis_templates (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sections JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX anamnesis_templates_org_idx ON anamnesis_templates (organization_id, is_active);

-- Anamnesis submissions (filled forms)
CREATE TABLE anamnesis_submissions (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL REFERENCES anamnesis_templates(id),
    patient_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')) DEFAULT 'pending',
    responses JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX anamnesis_submissions_patient_idx ON anamnesis_submissions (patient_id, created_at DESC);
CREATE INDEX anamnesis_submissions_org_idx ON anamnesis_submissions (organization_id, status);
CREATE INDEX anamnesis_submissions_token_idx ON anamnesis_submissions (token) WHERE status IN ('pending', 'in_progress');
