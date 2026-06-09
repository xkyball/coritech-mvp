BEGIN;

CREATE TYPE coritech_document_access_classification AS ENUM (
  'INTERNAL',
  'ORDER_PARTICIPANTS',
  'RESTRICTED',
  'BUYER_VIEW_ELIGIBLE',
  'ADMIN_ONLY'
);

CREATE TYPE coritech_document_link_target_type AS ENUM (
  'SemenOrder',
  'Shipment',
  'ProofEvent'
);

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL,
  description text,
  target_type coritech_document_link_target_type NOT NULL,
  target_id uuid NOT NULL,
  semen_order_id uuid,
  shipment_id uuid,
  proof_event_id uuid,
  order_number text,
  breeder_organization_id uuid,
  breeding_station_organization_id uuid,
  original_file_name text NOT NULL,
  content_type text NOT NULL,
  file_size_bytes bigint NOT NULL,
  checksum_sha256 text,
  storage_provider text NOT NULL,
  storage_bucket text NOT NULL,
  storage_object_key text NOT NULL,
  storage_region text,
  storage_version_id text,
  access_classification coritech_document_access_classification NOT NULL,
  uploaded_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  uploader_role_code coritech_role_code NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  uploader_organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT documents_id_target_unique UNIQUE (
    id,
    target_type,
    target_id
  ),
  CONSTRAINT documents_order_fk FOREIGN KEY (
    semen_order_id,
    order_number,
    breeder_organization_id,
    breeding_station_organization_id
  ) REFERENCES semen_orders (
    id,
    order_number,
    breeder_organization_id,
    breeding_station_organization_id
  ) ON DELETE RESTRICT,
  CONSTRAINT documents_shipment_fk FOREIGN KEY (
    shipment_id,
    semen_order_id,
    order_number
  ) REFERENCES shipments (
    id,
    semen_order_id,
    order_number
  ) ON DELETE RESTRICT,
  CONSTRAINT documents_exactly_one_primary_target CHECK (
    (
      target_type = 'SemenOrder'
      AND target_id = semen_order_id
      AND semen_order_id IS NOT NULL
      AND shipment_id IS NULL
      AND proof_event_id IS NULL
      AND order_number IS NOT NULL
      AND breeder_organization_id IS NOT NULL
      AND breeding_station_organization_id IS NOT NULL
    )
    OR (
      target_type = 'Shipment'
      AND target_id = shipment_id
      AND semen_order_id IS NOT NULL
      AND shipment_id IS NOT NULL
      AND proof_event_id IS NULL
      AND order_number IS NOT NULL
      AND breeder_organization_id IS NOT NULL
      AND breeding_station_organization_id IS NOT NULL
    )
    OR (
      target_type = 'ProofEvent'
      AND target_id = proof_event_id
      AND proof_event_id IS NOT NULL
    )
  ),
  CONSTRAINT documents_document_type_not_blank CHECK (length(trim(document_type)) > 0),
  CONSTRAINT documents_description_not_blank CHECK (
    description IS NULL OR length(trim(description)) > 0
  ),
  CONSTRAINT documents_original_file_name_not_blank CHECK (
    length(trim(original_file_name)) > 0
  ),
  CONSTRAINT documents_content_type_not_blank CHECK (length(trim(content_type)) > 0),
  CONSTRAINT documents_file_size_positive CHECK (file_size_bytes > 0),
  CONSTRAINT documents_checksum_sha256_shape CHECK (
    checksum_sha256 IS NULL OR checksum_sha256 ~ '^[a-fA-F0-9]{64}$'
  ),
  CONSTRAINT documents_storage_provider_not_blank CHECK (
    length(trim(storage_provider)) > 0
  ),
  CONSTRAINT documents_storage_provider_not_local CHECK (
    upper(trim(storage_provider)) NOT IN ('LOCAL', 'LOCAL_FILESYSTEM', 'FILESYSTEM')
  ),
  CONSTRAINT documents_storage_bucket_not_blank CHECK (
    length(trim(storage_bucket)) > 0
  ),
  CONSTRAINT documents_storage_object_key_not_blank CHECK (
    length(trim(storage_object_key)) > 0
  ),
  CONSTRAINT documents_storage_object_key_not_filesystem_path CHECK (
    storage_object_key !~ '^(file://|/|\.{1,2}/|~)'
  ),
  CONSTRAINT documents_storage_region_not_blank CHECK (
    storage_region IS NULL OR length(trim(storage_region)) > 0
  ),
  CONSTRAINT documents_storage_version_id_not_blank CHECK (
    storage_version_id IS NULL OR length(trim(storage_version_id)) > 0
  ),
  CONSTRAINT documents_uploader_phase_1_role CHECK (
    uploader_role_code IN ('BREEDER', 'BREEDING_STATION', 'PLATFORM_ADMIN')
  )
);

CREATE TABLE evidence_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_event_id uuid NOT NULL,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
  document_target_type coritech_document_link_target_type NOT NULL,
  document_target_id uuid NOT NULL,
  attached_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_role_code coritech_role_code NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  actor_organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  attached_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT evidence_attachments_document_target_fk FOREIGN KEY (
    document_id,
    document_target_type,
    document_target_id
  ) REFERENCES documents (
    id,
    target_type,
    target_id
  ) ON DELETE RESTRICT,
  CONSTRAINT evidence_attachments_actor_phase_1_role CHECK (
    actor_role_code IN ('BREEDER', 'BREEDING_STATION', 'PLATFORM_ADMIN')
  ),
  CONSTRAINT evidence_attachments_unique_document_per_proof_event UNIQUE (
    proof_event_id,
    document_id
  )
);

CREATE INDEX documents_order_lookup
  ON documents (semen_order_id, created_at DESC)
  WHERE semen_order_id IS NOT NULL;

CREATE INDEX documents_shipment_lookup
  ON documents (shipment_id, created_at DESC)
  WHERE shipment_id IS NOT NULL;

CREATE INDEX documents_proof_event_lookup
  ON documents (proof_event_id, created_at DESC)
  WHERE proof_event_id IS NOT NULL;

CREATE INDEX documents_access_lookup
  ON documents (access_classification, created_at DESC);

CREATE INDEX documents_storage_reference_lookup
  ON documents (storage_provider, storage_bucket, storage_object_key);

CREATE INDEX evidence_attachments_proof_event_lookup
  ON evidence_attachments (proof_event_id, attached_at, id);

CREATE INDEX evidence_attachments_document_lookup
  ON evidence_attachments (document_id, attached_at DESC);

COMMENT ON TYPE coritech_document_access_classification IS
  'Mandatory Phase 1 document access classification. BUYER_VIEW_ELIGIBLE is an eligibility marker only and does not grant buyer access in Phase 1.';

COMMENT ON TABLE documents IS
  'Document metadata and object-storage references for Phase 1 evidence. Raw file bytes and local filesystem paths must not be stored in this table.';

COMMENT ON COLUMN documents.target_type IS
  'Exactly one primary link target: semen order, shipment or proof event. ProofEvent persistence and foreign keys are owned by Ticket 1.6.';

COMMENT ON COLUMN documents.storage_object_key IS
  'Object-storage key controlled by the selected storage provider. This is not a local filesystem path or public unrestricted link.';

COMMENT ON COLUMN documents.access_classification IS
  'Required access classification used by application-level document access checks.';

COMMENT ON TABLE evidence_attachments IS
  'Relation attaching document metadata records to proof events. Ticket 1.5 prepares this relation before durable ProofEvent persistence is introduced.';

COMMENT ON COLUMN evidence_attachments.proof_event_id IS
  'Proof event identifier reserved for Ticket 1.6. A foreign key should be added when proof_events exists.';

COMMIT;
