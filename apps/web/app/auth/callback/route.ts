import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_FLOW_COOKIE_NAMES,
  AUTH_ROUTES,
  hasAuthenticatedSessionCookie,
  sanitizeReturnTo,
} from "../../../features/auth/auth-routes.mjs";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const providerError = request.nextUrl.searchParams.get("error");
  const returnTo = sanitizeReturnTo(
    request.cookies.get(AUTH_FLOW_COOKIE_NAMES.returnTo)?.value,
    {
      currentOrigin: request.nextUrl.origin,
    },
  );

  if (providerError) {
    if (providerError.toLowerCase().includes("verif")) {
      const verificationUrl = new URL(AUTH_ROUTES.emailVerificationPage, request.url);
      const response = NextResponse.redirect(verificationUrl, 302);
      clearAuthFlowCookies(response);

      return response;
    }

    return redirectToAuthError(request, "provider_error", returnTo);
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(AUTH_FLOW_COOKIE_NAMES.state)?.value;

  if (!code || !state) {
    return redirectToAuthError(request, "invalid_callback", returnTo);
  }

  if (!storedState || state !== storedState) {
    return redirectToAuthError(request, "invalid_state", returnTo);
  }

  if (hasAuthenticatedSessionCookie(request.headers.get("cookie"))) {
    const response = NextResponse.redirect(new URL(returnTo, request.url), 302);
    clearAuthFlowCookies(response);

    return response;
  }

  return redirectToAuthError(request, "session_adapter_pending", returnTo);
}

function redirectToAuthError(request: NextRequest, code: string, returnTo: string) {
  const errorUrl = new URL(AUTH_ROUTES.error, request.url);
  errorUrl.searchParams.set("code", code);
  errorUrl.searchParams.set("returnTo", returnTo);
  const response = NextResponse.redirect(errorUrl, 302);
  clearAuthFlowCookies(response);

  return response;
}

function clearAuthFlowCookies(response: NextResponse) {
  for (const name of [
    AUTH_FLOW_COOKIE_NAMES.state,
    AUTH_FLOW_COOKIE_NAMES.nonce,
    AUTH_FLOW_COOKIE_NAMES.returnTo,
  ]) {
    response.cookies.set(name, "", {
      maxAge: 0,
      path: "/",
    });
  }
}
