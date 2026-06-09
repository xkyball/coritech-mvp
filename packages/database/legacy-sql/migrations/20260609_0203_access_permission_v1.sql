BEGIN;

CREATE TYPE coritech_access_permission_scope AS ENUM (
  'VIEW',
  'CREATE',
  'UPDATE',
  'CONFIRM',
  'UPLOAD_DOCUMENT',
  'VIEW_DOCUMENT',
  'ADMIN_SUPPORT',
  'BUYER_VIEW'
);

CREATE TABLE access_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  organization_id uuid REFERENCES organizations(id) ON DELETE RESTRICT,
  role_code coritech_role_code REFERENCES roles(code) ON DELETE RESTRICT,
  object_type text NOT NULL,
  object_id uuid NOT NULL,
  scope coritech_access_permission_scope NOT NULL,
  granted_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  grantor_role_code coritech_role_code NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  grantor_organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  grant_reason text,
  effective_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  revocation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT access_permissions_subject_required CHECK (
    user_id IS NOT NULL OR organization_id IS NOT NULL OR role_code IS NOT NULL
  ),
  CONSTRAINT access_permissions_object_type_required CHECK (
    length(trim(object_type)) > 0
  ),
  CONSTRAINT access_permissions_grantor_platform_admin CHECK (
    grantor_role_code = 'PLATFORM_ADMIN'
  ),
  CONSTRAINT access_permissions_phase_1_active_subject_role CHECK (
    role_code IS NULL OR role_code IN ('BREEDER', 'BREEDING_STATION', 'PLATFORM_ADMIN')
  ),
  CONSTRAINT access_permissions_buyer_view_future_only CHECK (
    scope <> 'BUYER_VIEW'
  ),
  CONSTRAINT access_permissions_grant_reason_not_blank CHECK (
    grant_reason IS NULL OR length(trim(grant_reason)) > 0
  ),
  CONSTRAINT access_permissions_expires_after_effective CHECK (
    expires_at IS NULL OR expires_at >= effective_at
  ),
  CONSTRAINT access_permissions_revoked_after_effective CHECK (
    revoked_at IS NULL OR revoked_at >= effective_at
  ),
  CONSTRAINT access_permissions_revocation_reason_not_blank CHECK (
    revocation_reason IS NULL OR length(trim(revocation_reason)) > 0
  ),
  CONSTRAINT access_permissions_revocation_actor_required CHECK (
    (revoked_at IS NULL AND revoked_by_user_id IS NULL AND revocation_reason IS NULL)
    OR (revoked_at IS NOT NULL AND revoked_by_user_id IS NOT NULL AND revocation_reason IS NOT NULL)
  )
);

CREATE INDEX access_permissions_object_scope_active
  ON access_permissions (object_type, object_id, scope, effective_at, expires_at)
  WHERE revoked_at IS NULL;

CREATE INDEX access_permissions_user_object_active
  ON access_permissions (user_id, object_type, object_id, scope)
  WHERE user_id IS NOT NULL AND revoked_at IS NULL;

CREATE INDEX access_permissions_organization_object_active
  ON access_permissions (organization_id, object_type, object_id, scope)
  WHERE organization_id IS NOT NULL AND revoked_at IS NULL;

CREATE INDEX access_permissions_role_object_active
  ON access_permissions (role_code, object_type, object_id, scope)
  WHERE role_code IS NOT NULL AND revoked_at IS NULL;

CREATE INDEX access_permissions_grantor_timeline
  ON access_permissions (granted_by_user_id, created_at DESC, id);

COMMENT ON TYPE coritech_access_permission_scope IS
  'Ticket 2.3 object-level AccessPermission scopes. BUYER_VIEW is reserved for future controlled buyer workflows and is blocked by the Phase 1 table constraint and service checks.';

COMMENT ON TABLE access_permissions IS
  'Object-level access grants for controlled Phase 1 visibility. Grants are user, organization or role scoped and must be created/revoked through the audit-aware AccessPermission service.';

COMMENT ON COLUMN access_permissions.user_id IS
  'Optional user-specific grant subject. At least one subject field is required.';

COMMENT ON COLUMN access_permissions.organization_id IS
  'Optional organization grant subject. Service checks require the actor to hold an active Phase 1 role in this organization.';

COMMENT ON COLUMN access_permissions.role_code IS
  'Optional Phase 1 role grant subject. Future role codes, including BUYER, are not active AccessPermission subjects in Phase 1.';

COMMENT ON COLUMN access_permissions.object_type IS
  'Domain object type for the grant target, such as SemenOrder, Shipment, Document or ProofEvent.';

COMMENT ON COLUMN access_permissions.object_id IS
  'Domain object id for the grant target. Grants are object-level and do not provide unrestricted buyer or marketplace access.';

COMMENT ON COLUMN access_permissions.scope IS
  'Permission scope. BUYER_VIEW is reserved in the enum for migration stability but is not grantable or usable in Phase 1.';

COMMENT ON COLUMN access_permissions.granted_by_user_id IS
  'Platform-admin user who granted the permission. Application validation requires an active PLATFORM_ADMIN role.';

COMMENT ON COLUMN access_permissions.grantor_organization_id IS
  'Platform organization context for the granting admin actor.';

COMMENT ON COLUMN access_permissions.expires_at IS
  'Optional grant expiry used by the service-layer permission check.';

COMMENT ON COLUMN access_permissions.revoked_at IS
  'Optional revocation timestamp. Revoked permissions are ignored by service-layer checks.';

COMMIT;
