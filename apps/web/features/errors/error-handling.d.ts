export type MappedApiErrorKind =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation"
  | "unexpected";

export interface ValidationIssue {
  field: string | null;
  message: string;
}

export interface MappedApiError {
  kind: MappedApiErrorKind;
  status: number;
  code: string;
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string | null;
  validationIssues: ValidationIssue[];
}

export interface ErrorSurfaceModel {
  eyebrow: string;
  title: string;
  message: string;
  badge: string;
  actionLabel: string;
  actionHref: string;
}

export interface RuntimeErrorLogEvent {
  eventType: "runtime_error";
  digest: string | null;
  name: string;
  context: Record<string, string | number | boolean | null>;
}

export declare const ERROR_ROUTES: Readonly<{
  login: "/login";
  appHome: "/app";
  accessDenied: "/access-denied";
}>;
export declare const SAFE_UNEXPECTED_ERROR_MESSAGE: string;

export declare function mapApiErrorToUi(input: {
  status?: number | null;
  body?: unknown;
  fallbackMessage?: string;
}): MappedApiError;
export declare function normalizeValidationIssues(details: unknown): ValidationIssue[];
export declare function formatValidationSummary(
  issues: readonly ValidationIssue[],
): string;
export declare function createAccessDeniedViewModel(input?: {
  reason?: unknown;
  returnHref?: string;
}): ErrorSurfaceModel;
export declare function createUnauthenticatedViewModel(): ErrorSurfaceModel;
export declare function createNotFoundViewModel(input?: {
  resourceLabel?: unknown;
  returnHref?: string;
}): ErrorSurfaceModel;
export declare function createUnexpectedErrorViewModel(): ErrorSurfaceModel;
export declare function reportRuntimeError(
  error: unknown,
  context?: Record<string, unknown>,
  logger?: (event: RuntimeErrorLogEvent) => void,
): RuntimeErrorLogEvent;
export declare function createRuntimeErrorLogEvent(
  error: unknown,
  context?: Record<string, unknown>,
): RuntimeErrorLogEvent;
