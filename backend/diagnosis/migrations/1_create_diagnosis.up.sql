CREATE TABLE diagnoses (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'reviewed')) DEFAULT 'draft',
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    summary TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    suggested_conditions JSONB NOT NULL DEFAULT '[]'::JSONB,
    recommended_exams JSONB NOT NULL DEFAULT '[]'::JSONB,
    input_snapshot JSONB,
    clinical_notes TEXT,
    created_by TEXT NOT NULL,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX diagnoses_org_idx ON diagnoses (organization_id, created_at DESC);
CREATE INDEX diagnoses_patient_idx ON diagnoses (patient_id, created_at DESC);
CREATE INDEX diagnoses_status_idx ON diagnoses (organization_id, status, created_at DESC);

