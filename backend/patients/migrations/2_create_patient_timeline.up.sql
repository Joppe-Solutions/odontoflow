CREATE TABLE patient_timeline (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'created',
        'updated',
        'anamnesis_submitted',
        'exam_uploaded',
        'exam_reviewed',
        'diagnosis_created',
        'prescription_created',
        'note_added',
        'status_changed',
        'archived'
    )),
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    actor_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX patient_timeline_patient_idx ON patient_timeline (patient_id, created_at DESC);
CREATE INDEX patient_timeline_org_idx ON patient_timeline (organization_id, created_at DESC);
