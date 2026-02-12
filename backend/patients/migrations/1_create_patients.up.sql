CREATE TABLE patients (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    cpf TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    birth_date DATE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX patients_org_cpf_unique
    ON patients (organization_id, cpf)
    WHERE archived_at IS NULL;

CREATE INDEX patients_org_status_idx ON patients (organization_id, status);
CREATE INDEX patients_org_name_idx ON patients (organization_id, name);
