export interface AuthRouteMap {
  loginPage: "/login";
  loginAction: "/auth/login";
  callback: "/auth/callback";
  logoutPage: "/logout";
  logoutAction: "/auth/logout";
  loggedOut: "/logged-out";
  error: "/auth/error";
  passwordResetPage: "/password-reset";
  passwordResetAction: "/auth/password-reset";
  emailVerificationPage: "/auth/verification";
  appHome: "/app";
  breederApp: "/app/breeder";
  stationApp: "/app/station";
  adminApp: "/app/admin";
  noRole: "/app/no-role";
  selectRole: "/app/select-role";
  unauthorized: "/unauthorized";
}

export interface AuthFlowCookieNames {
  state: "coritech_auth_state";
  nonce: "coritech_auth_nonce";
  returnTo: "coritech_auth_return_to";
}

export interface AuthErrorDisplay {
  title: string;
  message: string;
}

export type ProtectedRouteResult =
  | { allowed: true; redirectTo: null }
  | { allowed: false; redirectTo: string };

export declare const AUTH_ROUTES: Readonly<AuthRouteMap>;
export declare const SESSION_COOKIE_NAMES: readonly string[];
export declare const AUTH_FLOW_COOKIE_NAMES: Readonly<AuthFlowCookieNames>;
export declare const PROTECTED_ROUTE_PREFIXES: readonly string[];
export declare const AUTH_ERROR_MESSAGES: Readonly<Record<string, AuthErrorDisplay>>;

export declare function getAuthErrorDisplay(code: unknown): AuthErrorDisplay;
export declare function isProtectedPath(pathname: unknown): boolean;
export declare function hasAuthenticatedSessionCookie(
  cookieHeader: unknown,
  sessionCookieNames?: readonly string[],
): boolean;
export declare function getAuthCookieClearNames(): string[];
export declare function sanitizeReturnTo(
  value: unknown,
  options?: { fallback?: string; currentOrigin?: string },
): string;
export declare function resolveProtectedRouteRequest(input: {
  url: string;
  cookieHeader?: string | null;
  currentOrigin?: string;
}): ProtectedRouteResult;
export declare function normalizeOptionalString(value: unknown): string | null;
