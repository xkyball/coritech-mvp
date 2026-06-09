BEGIN;

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

COMMIT;
