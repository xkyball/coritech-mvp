BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE coritech_user_status AS ENUM (
  'ACTIVE',
  'DISABLED'
);

CREATE TYPE coritech_organization_status AS ENUM (
  'ACTIVE',
  'DISABLED'
);

CREATE TYPE coritech_organization_type AS ENUM (
  'BREEDER',
  'BREEDING_STATION',
  'PLATFORM'
);

CREATE TYPE coritech_role_phase AS ENUM (
  'PHASE_1',
  'FUTURE_PREPARED'
);

CREATE TYPE coritech_role_code AS ENUM (
  'BREEDER',
  'BREEDING_STATION',
  'PLATFORM_ADMIN',
  'VET',
  'FEDERATION',
  'SALES_VENUE',
  'BUYER',
  'TECH_SUPPORT'
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  managed_auth_subject text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  status coritech_user_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_managed_auth_subject_required CHECK (length(trim(managed_auth_subject)) > 0),
  CONSTRAINT users_email_required CHECK (length(trim(email)) > 0),
  CONSTRAINT users_email_basic_shape CHECK (position('@' in email) > 1),
  CONSTRAINT users_display_name_required CHECK (length(trim(display_name)) > 0)
);

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization_type coritech_organization_type NOT NULL,
  status coritech_organization_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_name_required CHECK (length(trim(name)) > 0)
);

CREATE TABLE roles (
  code coritech_role_code PRIMARY KEY,
  phase coritech_role_phase NOT NULL,
  display_name text NOT NULL,
  description text NOT NULL,
  is_assignable_in_phase_1 boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT roles_display_name_required CHECK (length(trim(display_name)) > 0),
  CONSTRAINT roles_description_required CHECK (length(trim(description)) > 0),
  CONSTRAINT roles_phase_1_assignability CHECK (
    (phase = 'PHASE_1' AND is_assignable_in_phase_1 = true)
    OR (phase = 'FUTURE_PREPARED' AND is_assignable_in_phase_1 = false)
  )
);

INSERT INTO roles (
  code,
  phase,
  display_name,
  description,
  is_assignable_in_phase_1
) VALUES
  (
    'BREEDER',
    'PHASE_1',
    'Breeder',
    'Breeder organization user who can participate in owned semen ordering workflows.',
    true
  ),
  (
    'BREEDING_STATION',
    'PHASE_1',
    'Breeding Station',
    'Breeding station user who can manage station-owned semen listing and fulfillment workflows.',
    true
  ),
  (
    'PLATFORM_ADMIN',
    'PHASE_1',
    'Platform Admin',
    'CoriTech platform administrator authorized to manage foundational user, organization and role records.',
    true
  ),
  (
    'VET',
    'FUTURE_PREPARED',
    'Vet',
    'Prepared enum value for later veterinary workflows; not assignable in Phase 1.',
    false
  ),
  (
    'FEDERATION',
    'FUTURE_PREPARED',
    'Federation',
    'Prepared enum value for later federation or studbook workflows; not assignable in Phase 1.',
    false
  ),
  (
    'SALES_VENUE',
    'FUTURE_PREPARED',
    'Sales Venue',
    'Prepared enum value for later sales venue workflows; not assignable in Phase 1.',
    false
  ),
  (
    'BUYER',
    'FUTURE_PREPARED',
    'Buyer',
    'Prepared enum value for later controlled buyer workflows; not assignable in Phase 1.',
    false
  ),
  (
    'TECH_SUPPORT',
    'FUTURE_PREPARED',
    'Technical Support',
    'Prepared enum value for later technical support workflows; not assignable in Phase 1.',
    false
  );

CREATE TABLE user_organization_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  role_code coritech_role_code NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  assigned_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assignment_reason text,
  effective_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  revocation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_organization_roles_assignment_reason_not_blank CHECK (
    assignment_reason IS NULL OR length(trim(assignment_reason)) > 0
  ),
  CONSTRAINT user_organization_roles_revocation_reason_not_blank CHECK (
    revocation_reason IS NULL OR length(trim(revocation_reason)) > 0
  ),
  CONSTRAINT user_organization_roles_revoked_after_effective CHECK (
    revoked_at IS NULL OR revoked_at >= effective_at
  ),
  CONSTRAINT user_organization_roles_phase_1_assignable_role CHECK (
    role_code IN ('BREEDER', 'BREEDING_STATION', 'PLATFORM_ADMIN')
  ),
  CONSTRAINT user_organization_roles_revocation_actor_required CHECK (
    (revoked_at IS NULL AND revoked_by_user_id IS NULL AND revocation_reason IS NULL)
    OR (revoked_at IS NOT NULL AND revoked_by_user_id IS NOT NULL AND revocation_reason IS NOT NULL)
  )
);

CREATE UNIQUE INDEX user_organization_roles_one_active_role
  ON user_organization_roles (user_id, organization_id, role_code)
  WHERE revoked_at IS NULL;

CREATE INDEX user_organization_roles_user_lookup
  ON user_organization_roles (user_id, organization_id)
  WHERE revoked_at IS NULL;

CREATE INDEX user_organization_roles_organization_lookup
  ON user_organization_roles (organization_id, role_code)
  WHERE revoked_at IS NULL;

CREATE INDEX user_organization_roles_assigned_by_lookup
  ON user_organization_roles (assigned_by_user_id, created_at);

COMMENT ON TABLE users IS
  'Managed-auth-linked CoriTech user records. Authentication provider integration is intentionally handled by later approved tickets.';

COMMENT ON TABLE organizations IS
  'CoriTech organizations for Phase 1 breeder, breeding station and platform-admin contexts.';

COMMENT ON TABLE roles IS
  'Role catalog with Phase 1 assignable roles and future prepared enum values that are not assignable in Phase 1.';

COMMENT ON TABLE user_organization_roles IS
  'Organization-scoped role assignments. Inserts and revocations must emit the role assignment audit hook; the full AuditLog table is owned by Ticket 1.8.';

COMMENT ON COLUMN user_organization_roles.assigned_by_user_id IS
  'Admin actor who assigned the role. Application validation requires an active PLATFORM_ADMIN role.';

COMMENT ON COLUMN user_organization_roles.revoked_by_user_id IS
  'Admin actor who revoked the role. Application validation requires an active PLATFORM_ADMIN role.';

COMMIT;
