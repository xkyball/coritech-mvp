
-- Source: packages/database/legacy-sql/migrations/20260609_0101_user_organization_role_model.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE coritech_user_status AS ENUM (
  'ACTIVE',
  'DISABLED'
);

CREATE TYPE coritech_organization_status AS ENUM (
  'ACTIVE',
  'DISABLED'
);

CREATE TYPE coritech_organization_type AS ENUM (
  'BREEDER',
  'BREEDING_STATION',
  'PLATFORM'
);

CREATE TYPE coritech_role_phase AS ENUM (
  'PHASE_1',
  'FUTURE_PREPARED'
);

CREATE TYPE coritech_role_code AS ENUM (
  'BREEDER',
  'BREEDING_STATION',
  'PLATFORM_ADMIN',
  'VET',
  'FEDERATION',
  'SALES_VENUE',
  'BUYER',
  'TECH_SUPPORT'
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  managed_auth_subject text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  status coritech_user_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_managed_auth_subject_required CHECK (length(trim(managed_auth_subject)) > 0),
  CONSTRAINT users_email_required CHECK (length(trim(email)) > 0),
  CONSTRAINT users_email_basic_shape CHECK (position('@' in email) > 1),
  CONSTRAINT users_display_name_required CHECK (length(trim(display_name)) > 0)
);

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization_type coritech_organization_type NOT NULL,
  status coritech_organization_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_name_required CHECK (length(trim(name)) > 0)
);

CREATE TABLE roles (
  code coritech_role_code PRIMARY KEY,
  phase coritech_role_phase NOT NULL,
  display_name text NOT NULL,
  description text NOT NULL,
  is_assignable_in_phase_1 boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT roles_display_name_required CHECK (length(trim(display_name)) > 0),
  CONSTRAINT roles_description_required CHECK (length(trim(description)) > 0),
  CONSTRAINT roles_phase_1_assignability CHECK (
    (phase = 'PHASE_1' AND is_assignable_in_phase_1 = true)
    OR (phase = 'FUTURE_PREPARED' AND is_assignable_in_phase_1 = false)
  )
);

INSERT INTO roles (
  code,
  phase,
  display_name,
  description,
  is_assignable_in_phase_1
) VALUES
  (
    'BREEDER',
    'PHASE_1',
    'Breeder',
    'Breeder organization user who can participate in owned semen ordering workflows.',
    true
  ),
  (
    'BREEDING_STATION',
    'PHASE_1',
    'Breeding Station',
    'Breeding station user who can manage station-owned semen listing and fulfillment workflows.',
    true
  ),
  (
    'PLATFORM_ADMIN',
    'PHASE_1',
    'Platform Admin',
    'CoriTech platform administrator authorized to manage foundational user, organization and role records.',
    true
  ),
  (
    'VET',
    'FUTURE_PREPARED',
    'Vet',
    'Prepared enum value for later veterinary workflows; not assignable in Phase 1.',
    false
  ),
  (
    'FEDERATION',
    'FUTURE_PREPARED',
    'Federation',
    'Prepared enum value for later federation or studbook workflows; not assignable in Phase 1.',
    false
  ),
  (
    'SALES_VENUE',
    'FUTURE_PREPARED',
    'Sales Venue',
    'Prepared enum value for later sales venue workflows; not assignable in Phase 1.',
    false
  ),
  (
    'BUYER',
    'FUTURE_PREPARED',
    'Buyer',
    'Prepared enum value for later controlled buyer workflows; not assignable in Phase 1.',
    false
  ),
  (
    'TECH_SUPPORT',
    'FUTURE_PREPARED',
    'Technical Support',
    'Prepared enum value for later technical support workflows; not assignable in Phase 1.',
    false
  );

CREATE TABLE user_organization_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  role_code coritech_role_code NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  assigned_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assignment_reason text,
  effective_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  revocation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_organization_roles_assignment_reason_not_blank CHECK (
    assignment_reason IS NULL OR length(trim(assignment_reason)) > 0
  ),
  CONSTRAINT user_organization_roles_revocation_reason_not_blank CHECK (
    revocation_reason IS NULL OR length(trim(revocation_reason)) > 0
  ),
  CONSTRAINT user_organization_roles_revoked_after_effective CHECK (
    revoked_at IS NULL OR revoked_at >= effective_at
  ),
  CONSTRAINT user_organization_roles_phase_1_assignable_role CHECK (
    role_code IN ('BREEDER', 'BREEDING_STATION', 'PLATFORM_ADMIN')
  ),
  CONSTRAINT user_organization_roles_revocation_actor_required CHECK (
    (revoked_at IS NULL AND revoked_by_user_id IS NULL AND revocation_reason IS NULL)
    OR (revoked_at IS NOT NULL AND revoked_by_user_id IS NOT NULL AND revocation_reason IS NOT NULL)
  )
);

CREATE UNIQUE INDEX user_organization_roles_one_active_role
  ON user_organization_roles (user_id, organization_id, role_code)
  WHERE revoked_at IS NULL;

CREATE INDEX user_organization_roles_user_lookup
  ON user_organization_roles (user_id, organization_id)
  WHERE revoked_at IS NULL;

CREATE INDEX user_organization_roles_organization_lookup
  ON user_organization_roles (organization_id, role_code)
  WHERE revoked_at IS NULL;

CREATE INDEX user_organization_roles_assigned_by_lookup
  ON user_organization_roles (assigned_by_user_id, created_at);

COMMENT ON TABLE users IS
  'Managed-auth-linked CoriTech user records. Authentication provider integration is intentionally handled by later approved tickets.';

COMMENT ON TABLE organizations IS
  'CoriTech organizations for Phase 1 breeder, breeding station and platform-admin contexts.';

COMMENT ON TABLE roles IS
  'Role catalog with Phase 1 assignable roles and future prepared enum values that are not assignable in Phase 1.';

COMMENT ON TABLE user_organization_roles IS
  'Organization-scoped role assignments. Inserts and revocations must emit the role assignment audit hook; the full AuditLog table is owned by Ticket 1.8.';

COMMENT ON COLUMN user_organization_roles.assigned_by_user_id IS
  'Admin actor who assigned the role. Application validation requires an active PLATFORM_ADMIN role.';

COMMENT ON COLUMN user_organization_roles.revoked_by_user_id IS
  'Admin actor who revoked the role. Application validation requires an active PLATFORM_ADMIN role.';


-- Source: packages/database/legacy-sql/migrations/20260609_0102_stallion_semen_listing_model.sql

CREATE TYPE coritech_stallion_status AS ENUM (
  'ACTIVE',
  'INACTIVE'
);

CREATE TYPE coritech_semen_availability_status AS ENUM (
  'AVAILABLE',
  'LIMITED',
  'UNAVAILABLE'
);

CREATE TYPE coritech_semen_listing_status AS ENUM (
  'ACTIVE',
  'INACTIVE'
);

CREATE UNIQUE INDEX organizations_id_organization_type_lookup
  ON organizations (id, organization_type);

CREATE TABLE stallions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breeding_station_organization_id uuid NOT NULL,
  breeding_station_organization_type coritech_organization_type NOT NULL DEFAULT 'BREEDING_STATION',
  name text NOT NULL,
  breed text NOT NULL,
  ueln text,
  microchip_number text,
  status coritech_stallion_status NOT NULL DEFAULT 'ACTIVE',
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stallions_station_organization_type CHECK (
    breeding_station_organization_type = 'BREEDING_STATION'
  ),
  CONSTRAINT stallions_station_organization_fk FOREIGN KEY (
    breeding_station_organization_id,
    breeding_station_organization_type
  ) REFERENCES organizations (id, organization_type) ON DELETE RESTRICT,
  CONSTRAINT stallions_id_station_unique UNIQUE (
    id,
    breeding_station_organization_id
  ),
  CONSTRAINT stallions_name_required CHECK (length(trim(name)) > 0),
  CONSTRAINT stallions_breed_required CHECK (length(trim(breed)) > 0),
  CONSTRAINT stallions_ueln_not_blank CHECK (
    ueln IS NULL OR length(trim(ueln)) > 0
  ),
  CONSTRAINT stallions_microchip_number_not_blank CHECK (
    microchip_number IS NULL OR length(trim(microchip_number)) > 0
  )
);

CREATE TABLE semen_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stallion_id uuid NOT NULL,
  breeding_station_organization_id uuid NOT NULL,
  availability_status coritech_semen_availability_status NOT NULL DEFAULT 'AVAILABLE',
  listing_status coritech_semen_listing_status NOT NULL DEFAULT 'ACTIVE',
  terms_summary text,
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT semen_listings_stallion_station_fk FOREIGN KEY (
    stallion_id,
    breeding_station_organization_id
  ) REFERENCES stallions (
    id,
    breeding_station_organization_id
  ) ON DELETE RESTRICT,
  CONSTRAINT semen_listings_terms_summary_not_blank CHECK (
    terms_summary IS NULL OR length(trim(terms_summary)) > 0
  )
);

CREATE INDEX stallions_station_lookup
  ON stallions (breeding_station_organization_id, status);

CREATE INDEX stallions_name_search
  ON stallions (lower(name));

CREATE INDEX stallions_breed_search
  ON stallions (lower(breed));

CREATE INDEX semen_listings_station_lookup
  ON semen_listings (
    breeding_station_organization_id,
    listing_status,
    availability_status
  );

CREATE INDEX semen_listings_stallion_lookup
  ON semen_listings (stallion_id, listing_status);

CREATE INDEX semen_listings_active_search
  ON semen_listings (
    listing_status,
    availability_status,
    breeding_station_organization_id
  );

COMMENT ON TABLE stallions IS
  'Station-owned stallion catalog records for the Phase 1 semen-ordering MVP wedge.';

COMMENT ON COLUMN stallions.breeding_station_organization_id IS
  'Owning breeding station organization. Application writes require owning BREEDING_STATION role context or PLATFORM_ADMIN.';

COMMENT ON COLUMN stallions.ueln IS
  'Optional UELN identifier when available; not all Phase 1 records are expected to have one.';

COMMENT ON COLUMN stallions.microchip_number IS
  'Optional chip identifier when available; not all Phase 1 records are expected to have one.';

COMMENT ON TABLE semen_listings IS
  'Semen listing records linked to a stallion and owning breeding station. Listing writes must emit the SEMEN_LISTING_CHANGE audit hook until Ticket 1.8 creates the AuditLog table.';

COMMENT ON COLUMN semen_listings.availability_status IS
  'Operational availability state used for Phase 1 filtering and orderability checks.';

COMMENT ON COLUMN semen_listings.listing_status IS
  'ACTIVE listings can be shown to breeders; INACTIVE listings must not be orderable.';

COMMENT ON COLUMN semen_listings.terms_summary IS
  'Short operational terms summary only; this is not full marketplace automation or payment processing.';


-- Source: packages/database/legacy-sql/migrations/20260609_0103_semen_order_status_history.sql

CREATE TYPE coritech_semen_order_status AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'RECEIVED',
  'CONFIRMED',
  'REJECTED',
  'IN_FULFILMENT',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED'
);

CREATE SEQUENCE semen_order_number_sequence START WITH 1 INCREMENT BY 1;

CREATE FUNCTION generate_semen_order_number()
RETURNS text
LANGUAGE sql
AS $$
  SELECT
    'SO-' ||
    to_char(now(), 'YYYYMMDD') ||
    '-' ||
    lpad(nextval('semen_order_number_sequence')::text, 6, '0');
$$;

ALTER TABLE semen_listings
  ADD CONSTRAINT semen_listings_id_station_unique UNIQUE (
    id,
    breeding_station_organization_id
  );

CREATE TABLE semen_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL DEFAULT generate_semen_order_number(),
  semen_listing_id uuid NOT NULL,
  breeder_organization_id uuid NOT NULL,
  breeder_organization_type coritech_organization_type NOT NULL DEFAULT 'BREEDER',
  breeding_station_organization_id uuid NOT NULL,
  breeding_station_organization_type coritech_organization_type NOT NULL DEFAULT 'BREEDING_STATION',
  status coritech_semen_order_status NOT NULL DEFAULT 'DRAFT',
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT semen_orders_order_number_unique UNIQUE (order_number),
  CONSTRAINT semen_orders_id_order_number_unique UNIQUE (id, order_number),
  CONSTRAINT semen_orders_order_number_format CHECK (
    order_number ~ '^SO-[0-9]{8}-[0-9]{6,}$'
  ),
  CONSTRAINT semen_orders_breeder_organization_type CHECK (
    breeder_organization_type = 'BREEDER'
  ),
  CONSTRAINT semen_orders_station_organization_type CHECK (
    breeding_station_organization_type = 'BREEDING_STATION'
  ),
  CONSTRAINT semen_orders_breeder_organization_fk FOREIGN KEY (
    breeder_organization_id,
    breeder_organization_type
  ) REFERENCES organizations (id, organization_type) ON DELETE RESTRICT,
  CONSTRAINT semen_orders_station_organization_fk FOREIGN KEY (
    breeding_station_organization_id,
    breeding_station_organization_type
  ) REFERENCES organizations (id, organization_type) ON DELETE RESTRICT,
  CONSTRAINT semen_orders_listing_station_fk FOREIGN KEY (
    semen_listing_id,
    breeding_station_organization_id
  ) REFERENCES semen_listings (
    id,
    breeding_station_organization_id
  ) ON DELETE RESTRICT
);

CREATE TABLE order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semen_order_id uuid NOT NULL,
  order_number text NOT NULL,
  from_status coritech_semen_order_status,
  to_status coritech_semen_order_status NOT NULL,
  actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_role_code coritech_role_code NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  actor_organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  reason text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_status_history_order_fk FOREIGN KEY (
    semen_order_id,
    order_number
  ) REFERENCES semen_orders (id, order_number) ON DELETE RESTRICT,
  CONSTRAINT order_status_history_reason_not_blank CHECK (
    reason IS NULL OR length(trim(reason)) > 0
  ),
  CONSTRAINT order_status_history_actor_phase_1_role CHECK (
    actor_role_code IN ('BREEDER', 'BREEDING_STATION', 'PLATFORM_ADMIN')
  ),
  CONSTRAINT order_status_history_status_changed CHECK (
    from_status IS NULL OR from_status <> to_status
  ),
  CONSTRAINT order_status_history_allowed_transition CHECK (
    (from_status IS NULL AND to_status = 'DRAFT')
    OR (from_status = 'DRAFT' AND to_status IN ('SUBMITTED', 'CANCELLED'))
    OR (from_status = 'SUBMITTED' AND to_status IN ('RECEIVED', 'CANCELLED'))
    OR (from_status = 'RECEIVED' AND to_status IN ('CONFIRMED', 'REJECTED', 'CANCELLED'))
    OR (from_status = 'CONFIRMED' AND to_status IN ('IN_FULFILMENT', 'CANCELLED'))
    OR (from_status = 'IN_FULFILMENT' AND to_status IN ('SHIPPED', 'CANCELLED'))
    OR (from_status = 'SHIPPED' AND to_status = 'DELIVERED')
    OR (from_status = 'DELIVERED' AND to_status = 'COMPLETED')
  )
);

CREATE INDEX semen_orders_breeder_lookup
  ON semen_orders (breeder_organization_id, status, created_at DESC);

CREATE INDEX semen_orders_station_lookup
  ON semen_orders (breeding_station_organization_id, status, created_at DESC);

CREATE INDEX semen_orders_listing_lookup
  ON semen_orders (semen_listing_id, status);

CREATE INDEX order_status_history_order_timeline
  ON order_status_history (semen_order_id, changed_at, id);

CREATE INDEX order_status_history_actor_lookup
  ON order_status_history (actor_user_id, changed_at DESC);

COMMENT ON TABLE semen_orders IS
  'Phase 1 semen-order transaction records between breeder organizations and assigned breeding stations.';

COMMENT ON COLUMN semen_orders.order_number IS
  'Human-readable unique order number generated from the SO-YYYYMMDD-sequence convention.';

COMMENT ON COLUMN semen_orders.status IS
  'Current operational status. All status changes must be recorded in order_status_history and emit audit/proof hooks.';

COMMENT ON TABLE order_status_history IS
  'Append-only status transition history for semen orders. This records actor, role, organization, timestamp and reason; durable AuditLog and ProofEvent persistence are owned by later approved tickets.';

COMMENT ON COLUMN order_status_history.actor_role_code IS
  'Role context used for this status change. Phase 1 order workflow accepts BREEDER, BREEDING_STATION or PLATFORM_ADMIN only.';

COMMENT ON COLUMN order_status_history.reason IS
  'Optional operational reason for the status change. Rejections and cancellations should provide a reason at the application layer.';


-- Source: packages/database/legacy-sql/migrations/20260609_0104_shipment_tracking_event.sql

CREATE TYPE coritech_shipment_status AS ENUM (
  'PREPARED',
  'DISPATCHED',
  'IN_TRANSIT',
  'DELIVERED',
  'DELAYED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE coritech_shipment_tracking_event_source AS ENUM (
  'MANUAL',
  'LOGISTICS_PROVIDER',
  'SYSTEM'
);

ALTER TABLE semen_orders
  ADD CONSTRAINT semen_orders_shipment_reference_unique UNIQUE (
    id,
    order_number,
    breeder_organization_id,
    breeding_station_organization_id
  );

CREATE TABLE shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semen_order_id uuid NOT NULL,
  order_number text NOT NULL,
  breeder_organization_id uuid NOT NULL,
  breeding_station_organization_id uuid NOT NULL,
  status coritech_shipment_status NOT NULL DEFAULT 'PREPARED',
  provider_name text,
  provider_tracking_id text,
  tracking_url text,
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shipments_order_fk FOREIGN KEY (
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
  CONSTRAINT shipments_id_order_number_unique UNIQUE (
    id,
    semen_order_id,
    order_number
  ),
  CONSTRAINT shipments_provider_name_not_blank CHECK (
    provider_name IS NULL OR length(trim(provider_name)) > 0
  ),
  CONSTRAINT shipments_provider_tracking_id_not_blank CHECK (
    provider_tracking_id IS NULL OR length(trim(provider_tracking_id)) > 0
  ),
  CONSTRAINT shipments_tracking_url_not_blank CHECK (
    tracking_url IS NULL OR length(trim(tracking_url)) > 0
  ),
  CONSTRAINT shipments_tracking_url_http CHECK (
    tracking_url IS NULL OR tracking_url ~ '^https?://'
  )
);

CREATE TABLE shipment_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL,
  semen_order_id uuid NOT NULL,
  order_number text NOT NULL,
  from_status coritech_shipment_status,
  to_status coritech_shipment_status NOT NULL,
  event_source coritech_shipment_tracking_event_source NOT NULL DEFAULT 'MANUAL',
  source_event_id text,
  provider_status text,
  location text,
  notes text,
  actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_role_code coritech_role_code NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  actor_organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shipment_tracking_events_shipment_fk FOREIGN KEY (
    shipment_id,
    semen_order_id,
    order_number
  ) REFERENCES shipments (
    id,
    semen_order_id,
    order_number
  ) ON DELETE RESTRICT,
  CONSTRAINT shipment_tracking_events_actor_phase_1_role CHECK (
    actor_role_code IN ('BREEDING_STATION', 'PLATFORM_ADMIN')
  ),
  CONSTRAINT shipment_tracking_events_source_event_id_not_blank CHECK (
    source_event_id IS NULL OR length(trim(source_event_id)) > 0
  ),
  CONSTRAINT shipment_tracking_events_provider_status_not_blank CHECK (
    provider_status IS NULL OR length(trim(provider_status)) > 0
  ),
  CONSTRAINT shipment_tracking_events_location_not_blank CHECK (
    location IS NULL OR length(trim(location)) > 0
  ),
  CONSTRAINT shipment_tracking_events_notes_not_blank CHECK (
    notes IS NULL OR length(trim(notes)) > 0
  )
);

CREATE INDEX shipments_order_lookup
  ON shipments (semen_order_id, created_at DESC);

CREATE INDEX shipments_station_status_lookup
  ON shipments (breeding_station_organization_id, status, updated_at DESC);

CREATE INDEX shipments_breeder_lookup
  ON shipments (breeder_organization_id, updated_at DESC);

CREATE INDEX shipment_tracking_events_timeline
  ON shipment_tracking_events (shipment_id, occurred_at, id);

CREATE INDEX shipment_tracking_events_order_lookup
  ON shipment_tracking_events (semen_order_id, occurred_at DESC);

CREATE INDEX shipment_tracking_events_source_lookup
  ON shipment_tracking_events (event_source, occurred_at DESC);

CREATE UNIQUE INDEX shipment_tracking_events_source_event_unique
  ON shipment_tracking_events (shipment_id, event_source, source_event_id)
  WHERE source_event_id IS NOT NULL;

COMMENT ON TYPE coritech_shipment_status IS
  'Phase 1 normalized shipment statuses for semen-order fulfillment.';

COMMENT ON TYPE coritech_shipment_tracking_event_source IS
  'Source of a normalized shipment tracking event: manual MVP entry, future logistics provider update or system-generated event.';

COMMENT ON TABLE shipments IS
  'Phase 1 shipment records linked to confirmed semen orders. Shipment creation is application-gated to assigned breeding stations or platform admins.';

COMMENT ON COLUMN shipments.provider_name IS
  'Optional logistics provider display name. Phase 1 stores references only and does not implement a provider adapter.';

COMMENT ON COLUMN shipments.provider_tracking_id IS
  'Optional provider tracking reference for manual MVP tracking and future adapter normalization.';

COMMENT ON TABLE shipment_tracking_events IS
  'Append-only normalized shipment tracking timeline. Durable AuditLog and ProofEvent persistence are owned by later approved tickets.';

COMMENT ON COLUMN shipment_tracking_events.event_source IS
  'Manual, future provider-originated or system-originated source marker. This does not create provider automation in Ticket 1.4.';

COMMENT ON COLUMN shipment_tracking_events.source_event_id IS
  'Optional external event identifier for future logistics-provider deduplication.';


-- Source: packages/database/legacy-sql/migrations/20260609_0105_document_evidence_attachment.sql

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


-- Source: packages/database/legacy-sql/migrations/20260609_0106_proof_event_v1.sql

CREATE TYPE coritech_proof_event_type AS ENUM (
  'SEMEN_ORDER_CREATED',
  'SUBMITTED',
  'CONFIRMED',
  'REJECTED',
  'SHIPMENT_CREATED',
  'SHIPMENT_STATUS_UPDATED',
  'SHIPMENT_CONFIRMED',
  'DOCUMENT_UPLOADED',
  'ORDER_COMPLETED',
  'ADMIN_CORRECTION_CREATED'
);

CREATE TYPE coritech_proof_event_source AS ENUM (
  'ORDER_STATUS_CHANGE',
  'SHIPMENT_TRACKING_EVENT',
  'DOCUMENT_UPLOAD',
  'ADMIN_CORRECTION'
);

CREATE TYPE coritech_proof_event_status AS ENUM (
  'RECORDED',
  'VOIDED'
);

CREATE TABLE proof_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type coritech_proof_event_type NOT NULL,
  source coritech_proof_event_source NOT NULL,
  trigger_type text NOT NULL,
  trigger_ref jsonb NOT NULL,
  semen_order_id uuid,
  shipment_id uuid,
  horse_id uuid,
  order_number text,
  breeder_organization_id uuid,
  breeding_station_organization_id uuid,
  lifecycle_stage text NOT NULL,
  verification_level text NOT NULL DEFAULT 'WORKFLOW_RECORDED',
  status coritech_proof_event_status NOT NULL DEFAULT 'RECORDED',
  actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_role_code coritech_role_code NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  actor_organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  documentation_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  signature_ref jsonb,
  attestation_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  audit_log_id uuid,
  audit_hook_ref jsonb NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proof_events_order_fk FOREIGN KEY (
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
  CONSTRAINT proof_events_shipment_fk FOREIGN KEY (
    shipment_id,
    semen_order_id,
    order_number
  ) REFERENCES shipments (
    id,
    semen_order_id,
    order_number
  ) ON DELETE RESTRICT,
  CONSTRAINT proof_events_trigger_type_not_blank CHECK (
    length(trim(trigger_type)) > 0
  ),
  CONSTRAINT proof_events_trigger_ref_object CHECK (
    jsonb_typeof(trigger_ref) = 'object'
  ),
  CONSTRAINT proof_events_order_context_shape CHECK (
    (
      semen_order_id IS NULL
      AND order_number IS NULL
      AND breeder_organization_id IS NULL
      AND breeding_station_organization_id IS NULL
    )
    OR (
      semen_order_id IS NOT NULL
      AND order_number IS NOT NULL
      AND breeder_organization_id IS NOT NULL
      AND breeding_station_organization_id IS NOT NULL
    )
  ),
  CONSTRAINT proof_events_shipment_context_shape CHECK (
    shipment_id IS NULL
    OR (
      semen_order_id IS NOT NULL
      AND order_number IS NOT NULL
    )
  ),
  CONSTRAINT proof_events_source_link_shape CHECK (
    (
      source = 'ORDER_STATUS_CHANGE'
      AND semen_order_id IS NOT NULL
      AND shipment_id IS NULL
    )
    OR (
      source = 'SHIPMENT_TRACKING_EVENT'
      AND semen_order_id IS NOT NULL
      AND shipment_id IS NOT NULL
    )
    OR (
      source IN ('DOCUMENT_UPLOAD', 'ADMIN_CORRECTION')
      AND (
        semen_order_id IS NOT NULL
        OR shipment_id IS NOT NULL
        OR horse_id IS NOT NULL
      )
    )
  ),
  CONSTRAINT proof_events_source_event_type_pair CHECK (
    (
      source = 'ORDER_STATUS_CHANGE'
      AND event_type IN (
        'SEMEN_ORDER_CREATED',
        'SUBMITTED',
        'CONFIRMED',
        'REJECTED',
        'ORDER_COMPLETED'
      )
    )
    OR (
      source = 'SHIPMENT_TRACKING_EVENT'
      AND event_type IN (
        'SHIPMENT_CREATED',
        'SHIPMENT_STATUS_UPDATED',
        'SHIPMENT_CONFIRMED'
      )
    )
    OR (
      source = 'DOCUMENT_UPLOAD'
      AND event_type = 'DOCUMENT_UPLOADED'
    )
    OR (
      source = 'ADMIN_CORRECTION'
      AND event_type = 'ADMIN_CORRECTION_CREATED'
    )
  ),
  CONSTRAINT proof_events_lifecycle_stage_not_blank CHECK (
    length(trim(lifecycle_stage)) > 0
  ),
  CONSTRAINT proof_events_verification_level_not_blank CHECK (
    length(trim(verification_level)) > 0
  ),
  CONSTRAINT proof_events_actor_phase_1_role CHECK (
    actor_role_code IN ('BREEDER', 'BREEDING_STATION', 'PLATFORM_ADMIN')
  ),
  CONSTRAINT proof_events_documentation_refs_array CHECK (
    jsonb_typeof(documentation_refs) = 'array'
  ),
  CONSTRAINT proof_events_signature_ref_object CHECK (
    signature_ref IS NULL OR jsonb_typeof(signature_ref) = 'object'
  ),
  CONSTRAINT proof_events_attestation_refs_array CHECK (
    jsonb_typeof(attestation_refs) = 'array'
  ),
  CONSTRAINT proof_events_audit_hook_ref_object CHECK (
    jsonb_typeof(audit_hook_ref) = 'object'
  )
);

ALTER TABLE documents
  ADD CONSTRAINT documents_proof_event_fk FOREIGN KEY (
    proof_event_id
  ) REFERENCES proof_events (id) ON DELETE RESTRICT;

ALTER TABLE evidence_attachments
  ADD CONSTRAINT evidence_attachments_proof_event_fk FOREIGN KEY (
    proof_event_id
  ) REFERENCES proof_events (id) ON DELETE RESTRICT;

CREATE FUNCTION prevent_proof_event_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'proof_events are append-only; use an approved correction workflow instead of delete';
END;
$$;

CREATE TRIGGER proof_events_no_delete
BEFORE DELETE ON proof_events
FOR EACH ROW
EXECUTE FUNCTION prevent_proof_event_delete();

CREATE INDEX proof_events_order_timeline
  ON proof_events (semen_order_id, occurred_at, id)
  WHERE semen_order_id IS NOT NULL;

CREATE INDEX proof_events_shipment_timeline
  ON proof_events (shipment_id, occurred_at, id)
  WHERE shipment_id IS NOT NULL;

CREATE INDEX proof_events_horse_lookup
  ON proof_events (horse_id, occurred_at DESC)
  WHERE horse_id IS NOT NULL;

CREATE INDEX proof_events_actor_lookup
  ON proof_events (actor_user_id, occurred_at DESC);

CREATE INDEX proof_events_type_lookup
  ON proof_events (event_type, occurred_at DESC);

COMMENT ON TYPE coritech_proof_event_type IS
  'Ticket 1.6 proof event type list. Later automation tickets decide which workflow actions create these records automatically.';

COMMENT ON TYPE coritech_proof_event_source IS
  'Workflow source that requested the proof event. This is not blockchain, AI, federation or sensor automation.';

COMMENT ON TABLE proof_events IS
  'Append-only Phase 1 proof records linking workflow triggers, actor context, verification level, signature placeholders, documentation references and audit-hook context.';

COMMENT ON COLUMN proof_events.horse_id IS
  'Optional future horse/passport identifier. No federation or studbook automation is introduced by Ticket 1.6.';

COMMENT ON COLUMN proof_events.verification_level IS
  'Required starter verification-level value. Ticket 1.7 owns the formal taxonomy and derivation rules.';

COMMENT ON COLUMN proof_events.signature_ref IS
  'Managed-auth signature/identity reference placeholder. Later signature and attestation tickets may refine this structure.';

COMMENT ON COLUMN proof_events.audit_log_id IS
  'Reserved nullable link for Ticket 1.8 AuditLog persistence. Ticket 1.6 stores audit_hook_ref for the originating workflow hook.';

COMMENT ON COLUMN proof_events.audit_hook_ref IS
  'Originating workflow audit-hook reference connecting the proof event to the action that produced it before durable AuditLog exists.';

COMMENT ON TRIGGER proof_events_no_delete ON proof_events IS
  'Blocks silent deletion of proof events. Corrections must use approved amendment/admin workflows.';


-- Source: packages/database/legacy-sql/migrations/20260609_0107_verification_level_taxonomy.sql

CREATE TYPE coritech_verification_level AS ENUM (
  'SELF_REPORTED',
  'SYSTEM_RECORDED',
  'STATION_CONFIRMED',
  'ADMIN_REVIEWED',
  'VET_SIGNED',
  'FEDERATION_ATTESTED',
  'VERIFIED_FOR_TRANSACTION'
);

ALTER TABLE proof_events
  ALTER COLUMN verification_level DROP DEFAULT;

ALTER TABLE proof_events
  DROP CONSTRAINT proof_events_verification_level_not_blank;

ALTER TABLE proof_events
  ALTER COLUMN verification_level TYPE coritech_verification_level
  USING (
    CASE verification_level
      WHEN 'WORKFLOW_RECORDED' THEN 'SYSTEM_RECORDED'
      ELSE verification_level
    END::coritech_verification_level
  );

ALTER TABLE proof_events
  ADD CONSTRAINT proof_events_verification_level_phase_1_active CHECK (
    verification_level IN (
      'SELF_REPORTED',
      'SYSTEM_RECORDED',
      'STATION_CONFIRMED',
      'ADMIN_REVIEWED'
    )
  );

COMMENT ON TYPE coritech_verification_level IS
  'Ticket 1.7 verification-level taxonomy. Vet, federation and transaction-ready values are reserved for future phases and are not active on proof_events in Phase 1.';

COMMENT ON COLUMN proof_events.verification_level IS
  'Required Ticket 1.7 verification level derived from proof event type and actor role. Future taxonomy values are reserved but blocked by the Phase 1 active-level constraint.';

COMMENT ON CONSTRAINT proof_events_verification_level_phase_1_active
  ON proof_events IS
  'Limits proof_events to active Phase 1 verification levels while keeping future enum values reserved.';


-- Source: packages/database/legacy-sql/migrations/20260609_0108_audit_log_v1.sql

CREATE TYPE coritech_audit_log_action AS ENUM (
  'CREATE',
  'UPDATE',
  'STATUS_CHANGE',
  'UPLOAD_DOCUMENT',
  'VIEW_DOCUMENT',
  'CREATE_PROOF_EVENT',
  'CHANGE_PERMISSION',
  'ADMIN_EDIT',
  'CREATE_AMENDMENT',
  'LOGIN',
  'LOGOUT'
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_role_code coritech_role_code NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  actor_organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  action coritech_audit_log_action NOT NULL,
  source_action text,
  object_type text NOT NULL,
  object_id uuid NOT NULL,
  object_ref jsonb NOT NULL DEFAULT '{}'::jsonb,
  previous_values jsonb,
  new_values jsonb,
  reason text,
  ip_address inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_phase_1_actor_role CHECK (
    actor_role_code IN ('BREEDER', 'BREEDING_STATION', 'PLATFORM_ADMIN')
  ),
  CONSTRAINT audit_logs_source_action_not_blank CHECK (
    source_action IS NULL OR length(trim(source_action)) > 0
  ),
  CONSTRAINT audit_logs_object_type_not_blank CHECK (
    length(trim(object_type)) > 0
  ),
  CONSTRAINT audit_logs_object_ref_object CHECK (
    jsonb_typeof(object_ref) = 'object'
  ),
  CONSTRAINT audit_logs_previous_values_object CHECK (
    previous_values IS NULL OR jsonb_typeof(previous_values) = 'object'
  ),
  CONSTRAINT audit_logs_new_values_object CHECK (
    new_values IS NULL OR jsonb_typeof(new_values) = 'object'
  ),
  CONSTRAINT audit_logs_reason_not_blank CHECK (
    reason IS NULL OR length(trim(reason)) > 0
  ),
  CONSTRAINT audit_logs_user_agent_not_blank CHECK (
    user_agent IS NULL OR length(trim(user_agent)) > 0
  ),
  CONSTRAINT audit_logs_metadata_object CHECK (
    jsonb_typeof(metadata) = 'object'
  ),
  CONSTRAINT audit_logs_admin_edit_actor CHECK (
    action <> 'ADMIN_EDIT' OR actor_role_code = 'PLATFORM_ADMIN'
  ),
  CONSTRAINT audit_logs_change_permission_actor CHECK (
    action <> 'CHANGE_PERMISSION' OR actor_role_code = 'PLATFORM_ADMIN'
  )
);

CREATE FUNCTION prevent_audit_log_update_or_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs are append-only; create a later corrective audit entry instead of editing or deleting';
END;
$$;

CREATE TRIGGER audit_logs_no_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_update_or_delete();

CREATE TRIGGER audit_logs_no_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_update_or_delete();

CREATE INDEX audit_logs_object_timeline
  ON audit_logs (object_type, object_id, occurred_at, id);

CREATE INDEX audit_logs_actor_timeline
  ON audit_logs (actor_user_id, occurred_at DESC, id);

CREATE INDEX audit_logs_organization_timeline
  ON audit_logs (actor_organization_id, occurred_at DESC, id);

CREATE INDEX audit_logs_action_timeline
  ON audit_logs (action, occurred_at DESC, id);

ALTER TABLE proof_events
  ADD CONSTRAINT proof_events_audit_log_fk FOREIGN KEY (
    audit_log_id
  ) REFERENCES audit_logs (id) ON DELETE RESTRICT;

COMMENT ON TYPE coritech_audit_log_action IS
  'Ticket 1.8 normalized audit-log action list. Values support Phase 1 workflow evidence without blockchain, token, AI, federation or sensor automation.';

COMMENT ON TABLE audit_logs IS
  'Append-only Phase 1 operational audit trail recording actor, role, organization, action, target object, before/after values, reason, request metadata and timestamp.';

COMMENT ON COLUMN audit_logs.source_action IS
  'Domain-specific source action from the workflow audit hook, such as SEMEN_ORDER_SUBMITTED or DOCUMENT_VIEWED.';

COMMENT ON COLUMN audit_logs.object_ref IS
  'JSON reference snapshot for query and diligence context. It is not a public document link.';

COMMENT ON COLUMN audit_logs.previous_values IS
  'JSON object containing trust-relevant values before the action when applicable.';

COMMENT ON COLUMN audit_logs.new_values IS
  'JSON object containing trust-relevant values after the action when applicable.';

COMMENT ON COLUMN audit_logs.ip_address IS
  'Request IP address when available from the managed application edge; nullable for service-internal events.';

COMMENT ON COLUMN audit_logs.user_agent IS
  'Request user agent when available from the managed application edge; nullable for service-internal events.';

COMMENT ON TRIGGER audit_logs_no_update ON audit_logs IS
  'Blocks edits to audit log records. Later corrections must create new evidence.';

COMMENT ON TRIGGER audit_logs_no_delete ON audit_logs IS
  'Blocks deletion of audit log records. Retention policy is handled outside this ticket.';

COMMENT ON TABLE user_organization_roles IS
  'Organization-scoped role assignments. Inserts and revocations must emit role-assignment audit hooks that Ticket 1.8 materializes into append-only CHANGE_PERMISSION audit_logs entries.';

COMMENT ON TABLE semen_listings IS
  'Semen listing records linked to a stallion and owning breeding station. Listing writes must emit SEMEN_LISTING_CHANGE audit hooks that Ticket 1.8 materializes into append-only audit_logs entries.';

COMMENT ON COLUMN proof_events.audit_log_id IS
  'Nullable link to the originating audit_logs entry when an explicit proof-event service call is created from an audited workflow action.';


-- Source: packages/database/legacy-sql/migrations/20260609_0109_amendment_v1.sql

CREATE TYPE coritech_amendment_status AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE coritech_amendment_target_type AS ENUM (
  'SemenOrder',
  'OrderStatusHistory',
  'Shipment',
  'ShipmentTrackingEvent',
  'Document',
  'EvidenceAttachment',
  'ProofEvent'
);

CREATE TABLE amendments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type coritech_amendment_target_type NOT NULL,
  target_id uuid NOT NULL,
  target_field text,
  target_ref jsonb NOT NULL DEFAULT '{}'::jsonb,
  original_value jsonb NOT NULL,
  amended_value jsonb NOT NULL,
  reason text NOT NULL,
  status coritech_amendment_status NOT NULL DEFAULT 'SUBMITTED',
  actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_role_code coritech_role_code NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  actor_organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  approver_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  approver_role_code coritech_role_code REFERENCES roles(code) ON DELETE RESTRICT,
  approver_organization_id uuid REFERENCES organizations(id) ON DELETE RESTRICT,
  decided_at timestamptz,
  audit_log_id uuid REFERENCES audit_logs(id) ON DELETE RESTRICT,
  proof_event_id uuid REFERENCES proof_events(id) ON DELETE RESTRICT,
  semen_order_id uuid,
  shipment_id uuid,
  horse_id uuid,
  order_number text,
  breeder_organization_id uuid,
  breeding_station_organization_id uuid,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT amendments_order_fk FOREIGN KEY (
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
  CONSTRAINT amendments_shipment_fk FOREIGN KEY (
    shipment_id,
    semen_order_id,
    order_number
  ) REFERENCES shipments (
    id,
    semen_order_id,
    order_number
  ) ON DELETE RESTRICT,
  CONSTRAINT amendments_target_field_not_blank CHECK (
    target_field IS NULL OR length(trim(target_field)) > 0
  ),
  CONSTRAINT amendments_target_ref_object CHECK (
    jsonb_typeof(target_ref) = 'object'
  ),
  CONSTRAINT amendments_reason_not_blank CHECK (
    length(trim(reason)) > 0
  ),
  CONSTRAINT amendments_actor_admin CHECK (
    actor_role_code = 'PLATFORM_ADMIN'
  ),
  CONSTRAINT amendments_approver_admin CHECK (
    approver_role_code IS NULL OR approver_role_code = 'PLATFORM_ADMIN'
  ),
  CONSTRAINT amendments_decision_context CHECK (
    (
      status IN ('APPROVED', 'REJECTED')
      AND approver_user_id IS NOT NULL
      AND approver_role_code IS NOT NULL
      AND approver_organization_id IS NOT NULL
      AND decided_at IS NOT NULL
    )
    OR (
      status IN ('DRAFT', 'SUBMITTED')
      AND approver_user_id IS NULL
      AND approver_role_code IS NULL
      AND approver_organization_id IS NULL
      AND decided_at IS NULL
    )
  ),
  CONSTRAINT amendments_order_context_shape CHECK (
    (
      semen_order_id IS NULL
      AND order_number IS NULL
      AND breeder_organization_id IS NULL
      AND breeding_station_organization_id IS NULL
    )
    OR (
      semen_order_id IS NOT NULL
      AND order_number IS NOT NULL
      AND breeder_organization_id IS NOT NULL
      AND breeding_station_organization_id IS NOT NULL
    )
  ),
  CONSTRAINT amendments_shipment_context_shape CHECK (
    shipment_id IS NULL
    OR (
      semen_order_id IS NOT NULL
      AND order_number IS NOT NULL
    )
  )
);

CREATE INDEX amendments_target_timeline
  ON amendments (target_type, target_id, occurred_at DESC, id);

CREATE INDEX amendments_status_timeline
  ON amendments (status, occurred_at DESC, id);

CREATE INDEX amendments_order_timeline
  ON amendments (semen_order_id, occurred_at DESC, id)
  WHERE semen_order_id IS NOT NULL;

CREATE INDEX amendments_shipment_timeline
  ON amendments (shipment_id, occurred_at DESC, id)
  WHERE shipment_id IS NOT NULL;

CREATE INDEX amendments_proof_event_lookup
  ON amendments (proof_event_id)
  WHERE proof_event_id IS NOT NULL;

COMMENT ON TYPE coritech_amendment_status IS
  'Ticket 1.9 amendment status list. Status workflow automation is not implemented in this migration.';

COMMENT ON TYPE coritech_amendment_target_type IS
  'Selected Phase 1 proof-relevant records that can receive controlled correction evidence.';

COMMENT ON TABLE amendments IS
  'Ticket 1.9 controlled correction records. Amendments preserve original and amended values with reason, actor, optional approver, audit-log link and optional proof-event link without silently overwriting target records.';

COMMENT ON COLUMN amendments.target_id IS
  'Identifier of the selected proof-relevant target record. Generic by design; target-specific authorization is enforced in the application service.';

COMMENT ON COLUMN amendments.target_ref IS
  'JSON reference snapshot for due-diligence context. It is not a public document link and does not replace the target record.';

COMMENT ON COLUMN amendments.original_value IS
  'Original value snapshot preserved at amendment creation time.';

COMMENT ON COLUMN amendments.amended_value IS
  'Proposed or reviewed amended value. Ticket 1.9 does not apply this value to the target record.';

COMMENT ON COLUMN amendments.reason IS
  'Mandatory correction reason supplied by the platform admin.';

COMMENT ON COLUMN amendments.audit_log_id IS
  'Nullable link to the audit_logs entry created for this amendment.';

COMMENT ON COLUMN amendments.proof_event_id IS
  'Nullable link to a proof_events row, typically an explicit ADMIN_CORRECTION_CREATED proof event when created.';

COMMENT ON CONSTRAINT amendments_actor_admin ON amendments IS
  'Only platform admins can create Phase 1 amendment records.';

COMMENT ON CONSTRAINT amendments_decision_context ON amendments IS
  'Approved or rejected amendment rows require a platform-admin approver context; draft and submitted rows do not carry approval metadata.';


-- Source: packages/database/legacy-sql/migrations/20260609_0201_managed_auth_provider.sql

COMMENT ON TABLE users IS
  'CoriTech user records linked to provider-managed authentication subjects. Ticket 2.1 delegates credential handling, password reset, email verification and admin MFA to a CoriTech-controlled managed auth provider.';

COMMENT ON COLUMN users.managed_auth_subject IS
  'Stable external subject from the CoriTech-controlled managed auth provider. Used to map verified auth identities to internal users.';


-- Source: packages/database/legacy-sql/migrations/20260609_0203_access_permission_v1.sql

CREATE TYPE coritech_access_permission_scope AS ENUM (
  'VIEW',
  'CREATE',
  'UPDATE',
  'CONFIRM',
  'UPLOAD_DOCUMENT',
  'VIEW_DOCUMENT',
  'ADMIN_SUPPORT',
  'BUYER_VIEW'
);

CREATE TABLE access_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  organization_id uuid REFERENCES organizations(id) ON DELETE RESTRICT,
  role_code coritech_role_code REFERENCES roles(code) ON DELETE RESTRICT,
  object_type text NOT NULL,
  object_id uuid NOT NULL,
  scope coritech_access_permission_scope NOT NULL,
  granted_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  grantor_role_code coritech_role_code NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  grantor_organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  grant_reason text,
  effective_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  revocation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT access_permissions_subject_required CHECK (
    user_id IS NOT NULL OR organization_id IS NOT NULL OR role_code IS NOT NULL
  ),
  CONSTRAINT access_permissions_object_type_required CHECK (
    length(trim(object_type)) > 0
  ),
  CONSTRAINT access_permissions_grantor_platform_admin CHECK (
    grantor_role_code = 'PLATFORM_ADMIN'
  ),
  CONSTRAINT access_permissions_phase_1_active_subject_role CHECK (
    role_code IS NULL OR role_code IN ('BREEDER', 'BREEDING_STATION', 'PLATFORM_ADMIN')
  ),
  CONSTRAINT access_permissions_buyer_view_future_only CHECK (
    scope <> 'BUYER_VIEW'
  ),
  CONSTRAINT access_permissions_grant_reason_not_blank CHECK (
    grant_reason IS NULL OR length(trim(grant_reason)) > 0
  ),
  CONSTRAINT access_permissions_expires_after_effective CHECK (
    expires_at IS NULL OR expires_at >= effective_at
  ),
  CONSTRAINT access_permissions_revoked_after_effective CHECK (
    revoked_at IS NULL OR revoked_at >= effective_at
  ),
  CONSTRAINT access_permissions_revocation_reason_not_blank CHECK (
    revocation_reason IS NULL OR length(trim(revocation_reason)) > 0
  ),
  CONSTRAINT access_permissions_revocation_actor_required CHECK (
    (revoked_at IS NULL AND revoked_by_user_id IS NULL AND revocation_reason IS NULL)
    OR (revoked_at IS NOT NULL AND revoked_by_user_id IS NOT NULL AND revocation_reason IS NOT NULL)
  )
);

CREATE INDEX access_permissions_object_scope_active
  ON access_permissions (object_type, object_id, scope, effective_at, expires_at)
  WHERE revoked_at IS NULL;

CREATE INDEX access_permissions_user_object_active
  ON access_permissions (user_id, object_type, object_id, scope)
  WHERE user_id IS NOT NULL AND revoked_at IS NULL;

CREATE INDEX access_permissions_organization_object_active
  ON access_permissions (organization_id, object_type, object_id, scope)
  WHERE organization_id IS NOT NULL AND revoked_at IS NULL;

CREATE INDEX access_permissions_role_object_active
  ON access_permissions (role_code, object_type, object_id, scope)
  WHERE role_code IS NOT NULL AND revoked_at IS NULL;

CREATE INDEX access_permissions_grantor_timeline
  ON access_permissions (granted_by_user_id, created_at DESC, id);

COMMENT ON TYPE coritech_access_permission_scope IS
  'Ticket 2.3 object-level AccessPermission scopes. BUYER_VIEW is reserved for future controlled buyer workflows and is blocked by the Phase 1 table constraint and service checks.';

COMMENT ON TABLE access_permissions IS
  'Object-level access grants for controlled Phase 1 visibility. Grants are user, organization or role scoped and must be created/revoked through the audit-aware AccessPermission service.';

COMMENT ON COLUMN access_permissions.user_id IS
  'Optional user-specific grant subject. At least one subject field is required.';

COMMENT ON COLUMN access_permissions.organization_id IS
  'Optional organization grant subject. Service checks require the actor to hold an active Phase 1 role in this organization.';

COMMENT ON COLUMN access_permissions.role_code IS
  'Optional Phase 1 role grant subject. Future role codes, including BUYER, are not active AccessPermission subjects in Phase 1.';

COMMENT ON COLUMN access_permissions.object_type IS
  'Domain object type for the grant target, such as SemenOrder, Shipment, Document or ProofEvent.';

COMMENT ON COLUMN access_permissions.object_id IS
  'Domain object id for the grant target. Grants are object-level and do not provide unrestricted buyer or marketplace access.';

COMMENT ON COLUMN access_permissions.scope IS
  'Permission scope. BUYER_VIEW is reserved in the enum for migration stability but is not grantable or usable in Phase 1.';

COMMENT ON COLUMN access_permissions.granted_by_user_id IS
  'Platform-admin user who granted the permission. Application validation requires an active PLATFORM_ADMIN role.';

COMMENT ON COLUMN access_permissions.grantor_organization_id IS
  'Platform organization context for the granting admin actor.';

COMMENT ON COLUMN access_permissions.expires_at IS
  'Optional grant expiry used by the service-layer permission check.';

COMMENT ON COLUMN access_permissions.revoked_at IS
  'Optional revocation timestamp. Revoked permissions are ignored by service-layer checks.';

CREATE TABLE verification_levels (
  code coritech_verification_level PRIMARY KEY,
  display_name text NOT NULL,
  description text NOT NULL,
  is_active_in_phase_1 boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verification_levels_display_name_required CHECK (
    length(trim(display_name)) > 0
  ),
  CONSTRAINT verification_levels_description_required CHECK (
    length(trim(description)) > 0
  ),
  CONSTRAINT verification_levels_sort_order_positive CHECK (
    sort_order > 0
  ),
  CONSTRAINT verification_levels_phase_1_activity CHECK (
    (
      code IN (
        'SELF_REPORTED',
        'SYSTEM_RECORDED',
        'STATION_CONFIRMED',
        'ADMIN_REVIEWED'
      )
      AND is_active_in_phase_1 = true
    )
    OR (
      code IN (
        'VET_SIGNED',
        'FEDERATION_ATTESTED',
        'VERIFIED_FOR_TRANSACTION'
      )
      AND is_active_in_phase_1 = false
    )
  )
);

ALTER TABLE proof_events
  ADD CONSTRAINT proof_events_verification_level_catalog_fk FOREIGN KEY (
    verification_level
  ) REFERENCES verification_levels (code) ON DELETE RESTRICT;

COMMENT ON TABLE verification_levels IS
  'Seeded verification-level taxonomy for local development and review. Future levels are reserved and inactive in Phase 1.';

COMMENT ON COLUMN verification_levels.is_active_in_phase_1 IS
  'True only for active Phase 1 levels. Vet, federation and transaction-ready levels remain reserved for later phases.';
