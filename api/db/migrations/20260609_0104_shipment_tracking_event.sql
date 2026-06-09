BEGIN;

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

COMMIT;
