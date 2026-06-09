import type { UserOrganizationRoleLike } from "../identity/role-model.d.ts";

export type RbacPermissionAction =
  | "CREATE_SEMEN_ORDER"
  | "VIEW_SEMEN_ORDER"
  | "TRANSITION_SEMEN_ORDER_STATUS"
  | "MANAGE_STALLION"
  | "LIST_STALLIONS"
  | "MANAGE_SEMEN_LISTING"
  | "VIEW_SEMEN_LISTING"
  | "SEARCH_SEMEN_LISTINGS"
  | "CREATE_DOCUMENT"
  | "VIEW_DOCUMENT"
  | "LIST_ORDER_DOCUMENTS"
  | "LIST_SHIPMENT_DOCUMENTS"
  | "ATTACH_PROOF_EVIDENCE"
  | "LIST_PROOF_EVIDENCE_ATTACHMENTS";

export type RbacAccessDecisionOutcome = "ALLOW" | "DENY";

export interface RbacRouteContract {
  method: string;
  path: string;
  handler: string;
  permission: RbacPermissionAction;
  access: string;
}

export interface RbacActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface RbacAccessDecision {
  outcome: RbacAccessDecisionOutcome;
  allowed: boolean;
  status: 403 | null;
  action: RbacPermissionAction;
  actorUserId: string | null;
  actorRoleCode: string | null;
  actorOrganizationId: string | null;
  targetType: string | null;
  targetId: string | null;
  targetRef: Readonly<Record<string, unknown>>;
  handlerName: string | null;
  reason: string;
  deferred: boolean;
  occurredAt: string;
}

export interface RbacAccessDecisionBuildInput {
  action: RbacPermissionAction;
  allowed: boolean;
  actor?: RbacActorContext | null;
  matchedRole?: UserOrganizationRoleLike;
  targetType?: string | null;
  targetId?: string | null;
  targetRef?: Record<string, unknown> | null;
  handlerName?: string | null;
  reason?: string | null;
  deferred?: boolean;
  now?: string | Date;
}

export interface RbacAccessDecisionRepository {
  recordRbacAccessDecision?(
    decision: RbacAccessDecision,
  ): Promise<RbacAccessDecision | null | undefined>;
}

export interface RbacEndpointRequest<
  TBody = Record<string, unknown>,
  TQuery = Record<string, unknown>,
> {
  actor: RbacActorContext;
  repository: RbacAccessDecisionRepository & Record<string, unknown>;
  params?: Record<string, string | undefined>;
  body?: TBody;
  query?: TQuery;
  auditContext?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  } | null;
}

export interface EvaluateRbacPermissionInput {
  action: RbacPermissionAction;
  request: RbacEndpointRequest;
  handlerName?: string | null;
  now?: string | Date;
}

export interface RbacAccessDecisionLoggerOptions {
  recordAccessDecision?(
    decision: RbacAccessDecision,
  ): Promise<RbacAccessDecision | null | undefined>;
}

export interface RbacMiddlewareDefaultOptions
  extends RbacAccessDecisionLoggerOptions {
  now?: string | Date;
  logAllowedAccess?: boolean;
}

export interface RbacMiddlewareOptions<TRequest = unknown>
  extends RbacMiddlewareDefaultOptions {
  action: RbacPermissionAction;
  handlerName?: string | null;
}

export interface RbacForbiddenResponse {
  status: 403;
  body: {
    error: {
      code: "RBAC_FORBIDDEN";
      message: "Forbidden";
    };
  };
}

export declare const RBAC_PERMISSION_ACTIONS: readonly RbacPermissionAction[];
export declare const RBAC_ACCESS_DECISION_OUTCOMES: readonly RbacAccessDecisionOutcome[];
export declare const RBAC_PROTECTED_ROUTES: readonly RbacRouteContract[];

export declare class RbacMiddlewareValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare function isRbacPermissionAction(
  value: unknown,
): value is RbacPermissionAction;
export declare function isRbacAccessDecisionOutcome(
  value: unknown,
): value is RbacAccessDecisionOutcome;
export declare function findActiveActorRole(
  actor: RbacActorContext | null | undefined,
  roleCode: string,
  organizationId?: string | null,
): UserOrganizationRoleLike | undefined;
export declare function findPlatformAdminRole(
  actor: RbacActorContext | null | undefined,
): UserOrganizationRoleLike | undefined;
export declare function hasPhase1ActorRole(
  actor: RbacActorContext | null | undefined,
): boolean;
export declare function isAuthorizationError(error: unknown): boolean;
export declare function withRbacPermission<TRequest, TResponse>(
  handler: (request: TRequest) => Promise<TResponse> | TResponse,
  options: RbacMiddlewareOptions<TRequest>,
): (request: TRequest) => Promise<TResponse | RbacForbiddenResponse>;
export declare function createRbacMiddleware(
  defaultOptions?: RbacMiddlewareDefaultOptions,
): <TRequest, TResponse>(
  handler: (request: TRequest) => Promise<TResponse> | TResponse,
  options: RbacMiddlewareOptions<TRequest>,
) => (request: TRequest) => Promise<TResponse | RbacForbiddenResponse>;
export declare function evaluateRbacPermission(
  input: EvaluateRbacPermissionInput,
): Promise<RbacAccessDecision>;
export declare function recordRbacAccessDecision(
  request: RbacEndpointRequest,
  decision: RbacAccessDecision,
  options?: RbacAccessDecisionLoggerOptions,
): Promise<RbacAccessDecision | null>;
export declare function buildAccessDecision(
  input: RbacAccessDecisionBuildInput,
): RbacAccessDecision;
