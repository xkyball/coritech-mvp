CREATE TYPE coritech_support_request_object_type AS ENUM (
  'SemenOrder'
);

CREATE TYPE coritech_support_request_category AS ENUM (
  'ORDER_STATUS',
  'DOCUMENT_ACCESS',
  'SHIPMENT',
  'PAYMENT_REFERENCE',
  'ACCOUNT_ACCESS',
  'OTHER'
);

CREATE TYPE coritech_support_request_status AS ENUM (
  'OPEN',
  'IN_REVIEW',
  'RESOLVED',
  'CLOSED'
);

CREATE TYPE coritech_support_request_notification_status AS ENUM (
  'QUEUED',
  'SENT',
  'FAILED'
);

CREATE TABLE support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type coritech_support_request_object_type NOT NULL,
  object_id uuid NOT NULL REFERENCES semen_orders(id) ON DELETE RESTRICT,
  object_ref jsonb NOT NULL DEFAULT '{}',
  category coritech_support_request_category NOT NULL,
  message text NOT NULL,
  status coritech_support_request_status NOT NULL DEFAULT 'OPEN',
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_by_organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  created_by_role coritech_role_code NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  admin_notification_status coritech_support_request_notification_status NOT NULL DEFAULT 'QUEUED',
  admin_notification_queued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_requests_message_required CHECK (length(trim(message)) > 0),
  CONSTRAINT support_requests_order_object_type CHECK (object_type = 'SemenOrder'),
  CONSTRAINT support_requests_admin_notification_queue_complete CHECK (
    admin_notification_status <> 'QUEUED'
    OR admin_notification_queued_at IS NOT NULL
  )
);

CREATE INDEX support_requests_status_lookup
  ON support_requests (status, updated_at);

CREATE INDEX support_requests_object_lookup
  ON support_requests (object_type, object_id);

CREATE INDEX support_requests_organization_lookup
  ON support_requests (created_by_organization_id, created_at);

COMMENT ON TABLE support_requests IS
  'Order-linked user support requests. Creation queues admin action in the in-app support queue; provider notifications are owned by later notification tickets.';
