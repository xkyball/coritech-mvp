import type {
  ActiveContextSelection,
  ActiveRoleContextResolution,
  ManagedAuthSessionLike,
  ResolvedActiveContext,
} from "./role-routing.d.ts";
import type { DashboardContextOption } from "../../components/ui";

export type ActiveContextSwitchRuntimeResult =
  | {
      ok: true;
      reason: "CONTEXT_SWITCHED";
      activeContext: ResolvedActiveContext;
      availableContexts: ResolvedActiveContext[];
      cookieValue: string;
      redirectTo: string;
    }
  | {
      ok: false;
      reason: "AUTH_REQUIRED" | "INVALID_CONTEXT" | "UNAUTHORIZED_CONTEXT";
      cookieValue: "";
      redirectTo: string;
    };

export declare const ACTIVE_CONTEXT_COOKIE_NAME: "coritech_active_context";

export declare function buildActiveContextSelectionKey(
  context: ResolvedActiveContext | ActiveContextSelection,
): string;
export declare function parseActiveContextSelectionKey(
  value: unknown,
): ActiveContextSelection | null;
export declare function serializeActiveContextCookie(
  context: ActiveContextSelection | null | undefined,
): string;
export declare function parseActiveContextCookie(
  value: unknown,
): ActiveContextSelection | null;
export declare function resolveActiveContextFromSession(input: {
  session?: ManagedAuthSessionLike | null;
  cookieValue?: unknown;
}): ActiveRoleContextResolution;
export declare function resolveActiveContextSwitch(input: {
  session?: ManagedAuthSessionLike | null;
  selectedContextKey?: unknown;
}): ActiveContextSwitchRuntimeResult;
export declare function createDashboardContextOptions(
  availableContexts: readonly ResolvedActiveContext[],
): DashboardContextOption[];
