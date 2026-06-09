BEGIN;

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

COMMIT;
