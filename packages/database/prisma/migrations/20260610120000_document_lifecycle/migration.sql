CREATE TYPE coritech_document_status AS ENUM (
  'ACTIVE',
  'SUPERSEDED',
  'REVOKED'
);

ALTER TABLE documents
  ADD COLUMN status coritech_document_status NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN replaced_by_document_id uuid REFERENCES documents(id) ON DELETE RESTRICT,
  ADD COLUMN revocation_reason text,
  ADD COLUMN replacement_reason text,
  ADD COLUMN lifecycle_changed_at timestamptz(6),
  ADD COLUMN lifecycle_changed_by_user_id uuid,
  ADD COLUMN lifecycle_changed_by_role_code coritech_role_code,
  ADD COLUMN lifecycle_changed_by_organization_id uuid,
  ADD CONSTRAINT documents_replaced_by_not_self CHECK (
    replaced_by_document_id IS NULL OR replaced_by_document_id <> id
  ),
  ADD CONSTRAINT documents_revocation_reason_required CHECK (
    status <> 'REVOKED' OR revocation_reason IS NOT NULL
  ),
  ADD CONSTRAINT documents_replacement_reason_required CHECK (
    status <> 'SUPERSEDED' OR replacement_reason IS NOT NULL
  ),
  ADD CONSTRAINT documents_lifecycle_reason_not_blank CHECK (
    (revocation_reason IS NULL OR length(trim(revocation_reason)) > 0)
    AND (replacement_reason IS NULL OR length(trim(replacement_reason)) > 0)
  ),
  ADD CONSTRAINT documents_lifecycle_actor_complete CHECK (
    (
      lifecycle_changed_at IS NULL
      AND lifecycle_changed_by_user_id IS NULL
      AND lifecycle_changed_by_role_code IS NULL
      AND lifecycle_changed_by_organization_id IS NULL
    )
    OR (
      lifecycle_changed_at IS NOT NULL
      AND lifecycle_changed_by_user_id IS NOT NULL
      AND lifecycle_changed_by_role_code IS NOT NULL
      AND lifecycle_changed_by_organization_id IS NOT NULL
    )
  );

CREATE INDEX documents_status_lookup
  ON documents (status, created_at DESC);
