import type {
  CoriTechConfig,
  CoriTechEnvironment,
} from "../../config/environment.d.ts";
import type {
  OrganizationRoleMembership,
  UserOrganizationRoleLike,
  UserStatus,
} from "../identity/role-model.d.ts";

export type ManagedAuthProviderKind = "OIDC_MANAGED_AUTH";

export type ManagedAuthScope = "openid" | "profile" | "email";

export type ManagedAuthFlow = "LOGIN" | "SIGN_UP";

export type ManagedAuthProviderAction =
  | "PASSWORD_RESET"
  | "EMAIL_VERIFICATION";

export interface ManagedAuthRouteContract {
  method: "GET" | "POST";
  path: string;
  handler: string;
  access: string;
}

export interface ManagedAuthProviderConfigOptions {
  callbackPath?: string;
  logoutReturnPath?: string;
  postLoginPath?: string;
  sessionCookieName?: string;
}

export interface ManagedAuthSessionCookiePolicy {
  name: string;
  httpOnly: true;
  sameSite: "Lax";
  path: "/";
  secure: boolean;
  maxAgeSeconds: number;
}

export interface ManagedAuthPasswordHandlingPolicy {
  handledBy: "MANAGED_AUTH_PROVIDER";
  customPasswordStorage: false;
  customPasswordHashing: false;
  customPasswordResetTokens: false;
  localPasswordFieldsAllowed: false;
  reason: string;
}

export interface ManagedAuthAdminMfaPolicy {
  requiredForRoles: readonly ["PLATFORM_ADMIN"];
  enforcement: "MANAGED_AUTH_PROVIDER_TENANT_POLICY";
  documentationPath: string;
}

export interface AuthProviderAccountOwnershipPolicy {
  requiredOwner: "CoriTech";
  vendorOwnedProductionAccountAllowed: false;
  evidenceDocument: string;
}

export interface ManagedAuthProviderConfig {
  kind: ManagedAuthProviderKind;
  issuerBaseUrl: string;
  clientId: string;
  clientSecretEnvironmentKey: "AUTH_PROVIDER_CLIENT_SECRET";
  clientSecretConfigured: boolean;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  logoutEndpoint: string;
  jwksUri: string;
  openidConfigurationUrl: string;
  callbackUrl: string;
  logoutReturnUrl: string;
  defaultPostLoginUrl: string;
  scope: readonly ManagedAuthScope[];
  sessionCookie: ManagedAuthSessionCookiePolicy;
  passwordHandling: ManagedAuthPasswordHandlingPolicy;
  adminMfa: ManagedAuthAdminMfaPolicy;
  providerAccountOwnership: AuthProviderAccountOwnershipPolicy;
}

export interface ManagedAuthRedirectInput {
  flow: ManagedAuthFlow;
  state: string;
  nonce: string;
  loginHint?: string | null;
  prompt?: string | null;
}

export interface ManagedAuthLogoutInput {
  returnTo?: string | null;
  federated?: boolean;
}

export interface ManagedAuthPasswordResetInput {
  email: string;
}

export interface ManagedAuthEmailVerificationInput {
  subject: string;
  email: string;
}

export interface ManagedAuthProviderActionRequest {
  action: ManagedAuthProviderAction;
  handledByProvider: true;
  passwordHandledBy: "MANAGED_AUTH_PROVIDER";
  route: "/auth/password-reset" | "/auth/email-verification";
  subject?: string;
  userEmail: string;
  providerIssuerBaseUrl: string;
  providerEndpoint: null;
  customPasswordTokenCreated: false;
  delivery: "MANAGED_AUTH_PROVIDER_EMAIL";
  notes: string;
}

export interface ManagedAuthProviderIdentity {
  subject: string;
  email: string;
  emailVerified?: boolean;
  name?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  nickname?: string | null;
}

export interface ManagedAuthMappedUser {
  id: string | null;
  managedAuthSubject: string;
  email: string;
  displayName: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedAuthIdentityMappingInput {
  identity: ManagedAuthProviderIdentity;
  existingUser?: ManagedAuthMappedUser | null;
  userId?: string | null;
  now?: string | Date;
}

export interface ManagedAuthSessionUser {
  id: string;
  managedAuthSubject: string;
  email: string;
  displayName: string;
  status: UserStatus;
}

export interface ManagedAuthSessionInput {
  user: ManagedAuthSessionUser;
  roleAssignments?: UserOrganizationRoleLike[];
  sessionId?: string | null;
  providerSessionId?: string | null;
  issuedAt?: string | Date;
  expiresAt?: string | Date;
  now?: string | Date;
}

export interface ManagedAuthSessionContext {
  id: string | null;
  user: ManagedAuthSessionUser;
  providerSessionId: string | null;
  memberships: OrganizationRoleMembership[];
  issuedAt: string;
  expiresAt: string;
}

export declare const MANAGED_AUTH_PROVIDER_KIND: ManagedAuthProviderKind;
export declare const MANAGED_AUTH_SCOPES: readonly ManagedAuthScope[];
export declare const MANAGED_AUTH_FLOWS: readonly ManagedAuthFlow[];
export declare const MANAGED_AUTH_ROUTES: readonly ManagedAuthRouteContract[];
export declare const PASSWORD_HANDLING_POLICY: ManagedAuthPasswordHandlingPolicy;
export declare const ADMIN_MFA_POLICY: ManagedAuthAdminMfaPolicy;
export declare const AUTH_PROVIDER_ACCOUNT_OWNERSHIP_POLICY: AuthProviderAccountOwnershipPolicy;

export declare class ManagedAuthConfigError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class ManagedAuthValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare function isManagedAuthFlow(
  value: unknown,
): value is ManagedAuthFlow;

export declare function validateManagedAuthProviderEnvironment(
  environment: CoriTechConfig,
): string[];

export declare function createManagedAuthProviderConfig(
  environment: CoriTechConfig,
  options?: ManagedAuthProviderConfigOptions,
): ManagedAuthProviderConfig;

export declare function buildManagedAuthRedirectUrl(
  config: ManagedAuthProviderConfig,
  input: ManagedAuthRedirectInput,
): string;

export declare function buildManagedAuthLoginUrl(
  config: ManagedAuthProviderConfig,
  input: Omit<ManagedAuthRedirectInput, "flow">,
): string;

export declare function buildManagedAuthSignUpUrl(
  config: ManagedAuthProviderConfig,
  input: Omit<ManagedAuthRedirectInput, "flow">,
): string;

export declare function buildManagedAuthLogoutUrl(
  config: ManagedAuthProviderConfig,
  input?: ManagedAuthLogoutInput,
): string;

export declare function prepareManagedAuthPasswordResetRequest(
  config: ManagedAuthProviderConfig,
  input: ManagedAuthPasswordResetInput,
): ManagedAuthProviderActionRequest;

export declare function prepareManagedAuthEmailVerificationRequest(
  config: ManagedAuthProviderConfig,
  input: ManagedAuthEmailVerificationInput,
): ManagedAuthProviderActionRequest;

export declare function mapManagedAuthIdentityToInternalUser(
  input: ManagedAuthIdentityMappingInput,
): ManagedAuthMappedUser;

export declare function prepareManagedAuthSession(
  input: ManagedAuthSessionInput,
): ManagedAuthSessionContext;

export type { CoriTechConfig, CoriTechEnvironment };
