CREATE TABLE exams (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'ready', 'error')) DEFAULT 'pending',
    ocr_raw TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX exams_patient_idx ON exams (patient_id, created_at DESC);
CREATE INDEX exams_org_idx ON exams (organization_id, status);

CREATE TABLE exam_markers (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value NUMERIC,
    unit TEXT,
    reference_min NUMERIC,
    reference_max NUMERIC,
    status TEXT CHECK (status IN ('normal', 'low', 'high', 'critical')),
    source TEXT CHECK (source IN ('ocr', 'manual')) DEFAULT 'ocr',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX exam_markers_exam_idx ON exam_markers (exam_id);
CREATE INDEX exam_markers_name_idx ON exam_markers (name, created_at DESC);
