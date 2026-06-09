BEGIN;

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

COMMIT;
