BEGIN;

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

COMMIT;
