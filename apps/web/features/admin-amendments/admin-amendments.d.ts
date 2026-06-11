import type {
  Amendment,
  AmendmentRepository,
  AmendmentTargetType,
  EndpointResponse,
} from "@coritech/domain/amendments/amendment.d.ts";
import type { AuditRequestContext } from "@coritech/domain/audit/audit-log.d.ts";
import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";

export interface AdminAmendmentActorContext {
  userId: string;
  organizationId: string;
  organizationName: string;
  roleCode: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";
  roles: UserOrganizationRoleLike[];
}

export interface AdminAmendmentFormDefaults {
  targetType: AmendmentTargetType | "";
  targetId: string;
  targetField: string;
  orderNumber: string;
}

export interface AdminAmendmentRow {
  id: string | null;
  targetType: AmendmentTargetType;
  targetId: string;
  targetField: string;
  status: string;
  reason: string;
  orderNumber: string;
  occurredAt: string;
  auditHref: string;
  originalValuePreview: string;
  amendedValuePreview: string;
}

export interface AdminAmendmentViewModelInput {
  actor: AdminAmendmentActorContext;
  amendments?: readonly Amendment[];
  defaults?: Record<string, unknown> | AdminAmendmentFormDefaults | null;
}

export interface AdminAmendmentViewModel {
  state: "READY";
  routes: typeof ADMIN_AMENDMENT_ROUTES;
  canCreate: boolean;
  targetTypes: readonly AmendmentTargetType[];
  defaults: AdminAmendmentFormDefaults;
  rows: readonly AdminAmendmentRow[];
  mutationPolicy: {
    silentlyOverwriteTarget: false;
    createTargetUpdate: false;
    requiresReason: true;
    requiresAuditLog: true;
    reason: string;
  };
}

export interface CreateAdminAmendmentInput {
  actor: AdminAmendmentActorContext;
  repository: AmendmentRepository;
  auditContext?: AuditRequestContext | null;
  targetType?: string | null;
  targetId?: string | null;
  targetField?: string | null;
  amendedValue?: string | null;
  reason?: string | null;
  now?: string | Date;
}

export declare const ADMIN_AMENDMENT_ROUTES: Readonly<{
  list: "/app/admin/amendments";
  new: "/app/admin/amendments/new";
  audit: "/app/admin/audit";
}>;
export declare function canAccessAdminAmendments(
  actor: AdminAmendmentActorContext,
): boolean;
export declare function createAdminAmendmentViewModel(
  input: AdminAmendmentViewModelInput,
): AdminAmendmentViewModel;
export declare function createAdminAmendment(
  input: CreateAdminAmendmentInput,
): Promise<EndpointResponse<{ amendment: Amendment }>>;
export declare function normalizeAmendmentFormDefaults(
  input: Record<string, unknown>,
): AdminAmendmentFormDefaults;
export declare function formatAmendmentLabel(value: unknown): string;
