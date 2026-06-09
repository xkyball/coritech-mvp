BEGIN;

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

COMMIT;
