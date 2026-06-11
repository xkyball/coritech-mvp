import type { AuditLog, AuditRequestContext } from "../audit/audit-log.d.ts";
import type {
  OrganizationStatus,
  OrganizationType,
  User,
  UserOrganizationRole,
  UserOrganizationRoleLike,
  UserStatus,
} from "../identity/role-model.d.ts";

export type UserInvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
export type UserInvitationEmailStatus = "QUEUED" | "SENT" | "FAILED";
export type UserInvitationRoleCode = "BREEDER" | "BREEDING_STATION";
export type InvitationValidationState =
  | "VALID"
  | "INVALID"
  | "EXPIRED"
  | "USED"
  | "REVOKED";

export interface UserInvitationActorContext {
  userId: string;
  organizationId: string;
  organizationName?: string | null;
  roleCode: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";
  roles: UserOrganizationRoleLike[];
}

export interface InvitationOrganization {
  id: string;
  name: string;
  organizationType: OrganizationType;
  status: OrganizationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvitationUser {
  id: string;
  managedAuthSubject: string;
  email: string;
  displayName: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationUserCreateInput {
  id: string | null;
  managedAuthSubject: string;
  email: string;
  displayName: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserInvitation {
  id: string | null;
  email: string;
  organizationId: string;
  organizationName?: string | null;
  roleCode: UserInvitationRoleCode;
  status: UserInvitationStatus;
  tokenHash: string;
  expiresAt: string;
  invitedByUserId: string;
  invitedByOrganizationId: string;
  acceptedAt: string | null;
  acceptedUserId: string | null;
  acceptedRoleAssignmentId: string | null;
  revokedAt: string | null;
  revokedByUserId: string | null;
  revocationReason: string | null;
  emailDeliveryStatus: UserInvitationEmailStatus;
  emailQueuedAt: string | null;
  emailSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationEmailQueueInput {
  invitation: UserInvitation;
  invitationLink: string;
  queuedAt: string;
}

export interface UserInvitationRepository {
  getOrganizationById(organizationId: string): Promise<InvitationOrganization | null>;
  createInvitation(invitation: UserInvitation): Promise<UserInvitation>;
  updateInvitation(invitation: UserInvitation): Promise<UserInvitation>;
  findInvitationByTokenHash(tokenHash: string): Promise<UserInvitation | null>;
  findUserByEmail(email: string): Promise<InvitationUser | null>;
  createUser(user: InvitationUserCreateInput): Promise<InvitationUser>;
  updateUserProfile(user: InvitationUser): Promise<InvitationUser>;
  createUserOrganizationRole(
    assignment: UserOrganizationRole,
  ): Promise<UserOrganizationRole>;
  createAuditLog(auditLog: AuditLog): Promise<AuditLog>;
  queueInvitationEmail?(input: InvitationEmailQueueInput): Promise<void>;
}

export interface CreateUserInvitationInput {
  actor: UserInvitationActorContext;
  repository: UserInvitationRepository;
  email?: string | null;
  organizationId?: string | null;
  roleCode?: string | null;
  inviteBaseUrl?: string | null;
  expiresAt?: string | Date | null;
  expiresInDays?: number | string | null;
  tokenFactory?: (() => string) | null;
  now?: string | Date;
}

export interface CreatedUserInvitation {
  invitation: UserInvitation;
  inviteToken: string;
  invitationLink: string;
  emailDelivery: {
    status: UserInvitationEmailStatus;
    queuedAt: string | null;
  };
}

export interface ValidateUserInvitationTokenInput {
  repository: UserInvitationRepository;
  token?: string | null;
  now?: string | Date;
}

export interface InvitationValidationResult {
  state: InvitationValidationState;
  message: string;
  invitation: UserInvitation | null;
}

export interface AcceptUserInvitationInput {
  repository: UserInvitationRepository;
  token?: string | null;
  displayName?: string | null;
  auditContext?: AuditRequestContext | null;
  now?: string | Date;
}

export interface AcceptedUserInvitation {
  invitation: UserInvitation;
  user: User;
  assignment: UserOrganizationRole;
  auditHook: unknown;
  auditLog: AuditLog;
  landingHref: "/breeder-dashboard" | "/station-dashboard";
}

export declare const USER_INVITATION_STATUSES: readonly UserInvitationStatus[];
export declare const USER_INVITATION_EMAIL_STATUSES: readonly UserInvitationEmailStatus[];
export declare const USER_INVITATION_ROLE_CODES: readonly UserInvitationRoleCode[];
export declare const USER_INVITATION_ROUTES: Readonly<{
  admin: "/app/admin/invitations";
  accept: "/accept-invite";
}>;
export declare const USER_INVITATION_TOKEN_POLICY: Readonly<{
  tokenBytes: 32;
  minimumTokenLength: 43;
  defaultExpiryDays: 7;
  storedAsHash: true;
  roleGrantedOnAcceptanceOnly: true;
  emailDeliveryStatus: "QUEUED";
}>;
export declare class UserInvitationValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}
export declare class UserInvitationAuthorizationError extends Error {}
export declare class UserInvitationStateError extends Error {
  readonly state: InvitationValidationState;
  constructor(state: InvitationValidationState, message: string);
}
export declare function canCreateUserInvitation(
  actor: UserInvitationActorContext,
): boolean;
export declare function isUserInvitationStatus(
  value: unknown,
): value is UserInvitationStatus;
export declare function isUserInvitationRoleCode(
  value: unknown,
): value is UserInvitationRoleCode;
export declare function generateInvitationToken(): string;
export declare function hashInvitationToken(token: string): string;
export declare function safeInvitationTokenHashEqual(left: string, right: string): boolean;
export declare function createUserInvitation(
  input: CreateUserInvitationInput,
): Promise<CreatedUserInvitation>;
export declare function validateUserInvitationToken(
  input: ValidateUserInvitationTokenInput,
): Promise<InvitationValidationResult>;
export declare function acceptUserInvitation(
  input: AcceptUserInvitationInput,
): Promise<AcceptedUserInvitation>;
export declare function getInvitationLandingHref(
  roleCode: UserInvitationRoleCode,
): "/breeder-dashboard" | "/station-dashboard";
export declare function buildInvitationLink(
  baseUrl: string | null | undefined,
  token: string,
): string;
