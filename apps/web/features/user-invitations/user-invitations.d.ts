import type { AuditRequestContext } from "@coritech/domain/audit/audit-log.d.ts";
import type {
  InvitationOrganization,
  InvitationValidationResult,
  AcceptedUserInvitation,
  CreatedUserInvitation,
  UserInvitation,
  UserInvitationRepository,
  UserInvitationRoleCode,
} from "@coritech/domain/onboarding/user-invitation.d.ts";
import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";

export interface UserInvitationActorContext {
  userId: string;
  organizationId: string;
  organizationName: string;
  roleCode: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";
  roles: UserOrganizationRoleLike[];
}

export interface UserInvitationFilters {
  status: string;
  email: string;
  organizationId: string;
}

export interface UserInvitationOrganizationOption {
  id: string;
  name: string;
  organizationType: string;
  label: string;
}

export interface UserInvitationRow {
  id: string | null;
  email: string;
  organizationLabel: string;
  roleLabel: string;
  status: string;
  expiresAt: string;
  acceptedAt: string;
  emailDeliveryStatus: string;
  emailQueuedAt: string;
}

export interface UserInvitationAdminViewModelInput {
  actor: UserInvitationActorContext;
  invitations?: readonly UserInvitation[];
  organizations?: readonly InvitationOrganization[];
  filters?: Record<string, unknown> | UserInvitationFilters | null;
  createdInvitationLink?: string | null;
}

export interface UserInvitationAdminViewModel {
  state: "READY";
  routes: typeof USER_INVITATION_ADMIN_ROUTES;
  canCreate: boolean;
  roleOptions: readonly UserInvitationRoleCode[];
  organizationOptions: readonly UserInvitationOrganizationOption[];
  rows: readonly UserInvitationRow[];
  filters: UserInvitationFilters;
  createdInvitationLink: string;
  emailDeliveryNote: string;
}

export interface InvitationAcceptViewModelInput {
  validation: InvitationValidationResult;
  token?: string | null;
}

export interface InvitationAcceptViewModel {
  state: InvitationValidationResult["state"];
  token: string;
  message: string;
  invitation: {
    email: string;
    organizationName: string;
    roleLabel: string;
    expiresAt: string;
  } | null;
  landingHref: string;
  canAccept: boolean;
}

export interface CreateManagedUserInvitationInput {
  actor: UserInvitationActorContext;
  repository: UserInvitationRepository;
  email?: string | null;
  organizationId?: string | null;
  roleCode?: string | null;
  inviteBaseUrl?: string | null;
  expiresInDays?: string | number | null;
  now?: string | Date;
}

export interface AcceptManagedUserInvitationInput {
  repository: UserInvitationRepository;
  token?: string | null;
  displayName?: string | null;
  auditContext?: AuditRequestContext | null;
  now?: string | Date;
}

export interface ValidateManagedUserInvitationInput {
  repository: UserInvitationRepository;
  token?: string | null;
  now?: string | Date;
}

export declare const USER_INVITATION_ADMIN_ROUTES: Readonly<{
  admin: "/app/admin/invitations";
  accept: "/accept-invite";
  login: "/auth/login";
}>;
export declare function canManageUserInvitations(
  actor: UserInvitationActorContext,
): boolean;
export declare function createUserInvitationAdminViewModel(
  input: UserInvitationAdminViewModelInput,
): UserInvitationAdminViewModel;
export declare function createInvitationAcceptViewModel(
  input: InvitationAcceptViewModelInput,
): InvitationAcceptViewModel;
export declare function createManagedUserInvitation(
  input: CreateManagedUserInvitationInput,
): Promise<CreatedUserInvitation>;
export declare function acceptManagedUserInvitation(
  input: AcceptManagedUserInvitationInput,
): Promise<AcceptedUserInvitation>;
export declare function validateManagedUserInvitation(
  input: ValidateManagedUserInvitationInput,
): Promise<InvitationValidationResult>;
export declare function normalizeInvitationFilters(
  input: Record<string, unknown>,
): UserInvitationFilters;
export declare function formatInvitationLabel(value: unknown): string;
