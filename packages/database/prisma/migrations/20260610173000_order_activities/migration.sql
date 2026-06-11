CREATE TYPE coritech_order_activity_type AS ENUM (
  'SYSTEM_STATUS',
  'USER_COMMENT',
  'INTERNAL_NOTE',
  'SUPPORT_NOTE'
);

CREATE TYPE coritech_order_activity_visibility AS ENUM (
  'SHARED',
  'STATION_INTERNAL',
  'ADMIN_INTERNAL'
);

CREATE TABLE order_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semen_order_id uuid NOT NULL REFERENCES semen_orders(id) ON DELETE RESTRICT,
  order_number text NOT NULL,
  type coritech_order_activity_type NOT NULL,
  visibility coritech_order_activity_visibility NOT NULL DEFAULT 'SHARED',
  message text NOT NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  created_by_organization_id uuid REFERENCES organizations(id) ON DELETE RESTRICT,
  created_by_role coritech_role_code REFERENCES roles(code) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_activities_order_number_required CHECK (length(trim(order_number)) > 0),
  CONSTRAINT order_activities_message_required CHECK (length(trim(message)) > 0),
  CONSTRAINT order_activities_actor_context_complete CHECK (
    (
      created_by_user_id IS NULL
      AND created_by_organization_id IS NULL
      AND created_by_role IS NULL
    )
    OR (
      created_by_user_id IS NOT NULL
      AND created_by_organization_id IS NOT NULL
      AND created_by_role IS NOT NULL
    )
  ),
  CONSTRAINT order_activities_support_note_admin_only CHECK (
    type <> 'SUPPORT_NOTE' OR visibility = 'ADMIN_INTERNAL'
  ),
  CONSTRAINT order_activities_internal_note_not_shared CHECK (
    type <> 'INTERNAL_NOTE' OR visibility <> 'SHARED'
  )
);

CREATE INDEX order_activities_order_timeline
  ON order_activities (semen_order_id, created_at, id);

CREATE INDEX order_activities_actor_lookup
  ON order_activities (created_by_user_id, created_at);

CREATE INDEX order_activities_visibility_lookup
  ON order_activities (visibility, created_at);

COMMENT ON TABLE order_activities IS
  'Lightweight order activity and comments feed. Comments provide operational context and do not replace status history, proof events or immutable audit logs.';

COMMENT ON COLUMN order_activities.type IS
  'SYSTEM_STATUS entries may be derived from order status history by application services; persisted user comments and internal notes retain actor context.';
