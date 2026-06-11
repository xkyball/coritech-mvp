CREATE TYPE coritech_user_invitation_status AS ENUM (
  'PENDING',
  'ACCEPTED',
  'EXPIRED',
  'REVOKED'
);

CREATE TYPE coritech_user_invitation_email_status AS ENUM (
  'QUEUED',
  'SENT',
  'FAILED'
);

CREATE TABLE user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  organization_name text,
  role_code coritech_role_code NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  status coritech_user_invitation_status NOT NULL DEFAULT 'PENDING',
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  invited_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  invited_by_organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  accepted_at timestamptz,
  accepted_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  accepted_role_assignment_id uuid REFERENCES user_organization_roles(id) ON DELETE RESTRICT,
  revoked_at timestamptz,
  revoked_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  revocation_reason text,
  email_delivery_status coritech_user_invitation_email_status NOT NULL DEFAULT 'QUEUED',
  email_queued_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_invitations_email_required CHECK (length(trim(email)) > 0),
  CONSTRAINT user_invitations_email_basic_shape CHECK (position('@' in email) > 1),
  CONSTRAINT user_invitations_token_hash_required CHECK (length(trim(token_hash)) >= 64),
  CONSTRAINT user_invitations_invitable_phase_1_roles CHECK (
    role_code IN ('BREEDER', 'BREEDING_STATION')
  ),
  CONSTRAINT user_invitations_pending_has_future_expiry CHECK (
    status <> 'PENDING' OR expires_at > created_at
  ),
  CONSTRAINT user_invitations_accepted_state_complete CHECK (
    (
      status = 'ACCEPTED'
      AND accepted_at IS NOT NULL
      AND accepted_user_id IS NOT NULL
      AND accepted_role_assignment_id IS NOT NULL
    )
    OR (
      status <> 'ACCEPTED'
      AND accepted_at IS NULL
      AND accepted_user_id IS NULL
      AND accepted_role_assignment_id IS NULL
    )
  ),
  CONSTRAINT user_invitations_revoked_state_complete CHECK (
    (
      status = 'REVOKED'
      AND revoked_at IS NOT NULL
      AND revoked_by_user_id IS NOT NULL
      AND revocation_reason IS NOT NULL
      AND length(trim(revocation_reason)) > 0
    )
    OR (
      status <> 'REVOKED'
      AND revoked_at IS NULL
      AND revoked_by_user_id IS NULL
      AND revocation_reason IS NULL
    )
  )
);

CREATE INDEX user_invitations_email_status_lookup
  ON user_invitations (email, status, expires_at);

CREATE INDEX user_invitations_organization_lookup
  ON user_invitations (organization_id, status, expires_at);

CREATE INDEX user_invitations_inviter_lookup
  ON user_invitations (invited_by_user_id, created_at);

COMMENT ON TABLE user_invitations IS
  'Admin-created onboarding invitations. Raw invite tokens are never stored; accepting a pending token creates or links the user and records the organization role audit trail.';

COMMENT ON COLUMN user_invitations.email_delivery_status IS
  'Queued by Ticket 18.04. Ticket 9.1 owns concrete email provider delivery.';
