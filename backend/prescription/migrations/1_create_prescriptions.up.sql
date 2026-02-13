CREATE TABLE prescriptions (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    diagnosis_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'signed', 'cancelled')) DEFAULT 'draft',
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    notes TEXT,
    valid_until DATE,
    created_by TEXT NOT NULL,
    signed_by TEXT,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX prescriptions_org_idx ON prescriptions (organization_id, created_at DESC);
CREATE INDEX prescriptions_patient_idx ON prescriptions (patient_id, created_at DESC);
CREATE INDEX prescriptions_status_idx ON prescriptions (organization_id, status, created_at DESC);

