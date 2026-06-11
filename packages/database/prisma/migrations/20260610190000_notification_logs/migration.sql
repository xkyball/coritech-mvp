CREATE TYPE coritech_notification_channel AS ENUM (
  'EMAIL'
);

CREATE TYPE coritech_notification_delivery_status AS ENUM (
  'QUEUED',
  'SENT',
  'FAILED',
  'RETRY_PENDING'
);

CREATE TABLE notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  template_id text NOT NULL,
  channel coritech_notification_channel NOT NULL DEFAULT 'EMAIL',
  recipient_rule text NOT NULL,
  recipient_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  recipient_organization_id uuid REFERENCES organizations(id) ON DELETE RESTRICT,
  recipient_role coritech_role_code REFERENCES roles(code) ON DELETE RESTRICT,
  recipient_ref jsonb NOT NULL DEFAULT '{}',
  payload jsonb NOT NULL DEFAULT '{}',
  status coritech_notification_delivery_status NOT NULL DEFAULT 'QUEUED',
  attempt_count integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_logs_event_type_required CHECK (length(trim(event_type)) > 0),
  CONSTRAINT notification_logs_template_id_required CHECK (length(trim(template_id)) > 0),
  CONSTRAINT notification_logs_recipient_rule_required CHECK (length(trim(recipient_rule)) > 0),
  CONSTRAINT notification_logs_attempt_count_non_negative CHECK (attempt_count >= 0),
  CONSTRAINT notification_logs_retry_placeholder_complete CHECK (
    status <> 'RETRY_PENDING' OR next_retry_at IS NOT NULL
  )
);

CREATE INDEX notification_logs_event_lookup
  ON notification_logs (event_type, created_at);

CREATE INDEX notification_logs_template_lookup
  ON notification_logs (template_id, created_at);

CREATE INDEX notification_logs_status_retry_lookup
  ON notification_logs (status, next_retry_at);

COMMENT ON TABLE notification_logs IS
  'Provider-agnostic notification delivery log placeholder. Ticket 18.18 records template references; provider dispatch and retry orchestration belong to later notification tickets.';
