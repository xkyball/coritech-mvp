import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_FLOW_COOKIE_NAMES,
  AUTH_ROUTES,
  sanitizeReturnTo,
} from "../../../features/auth/auth-routes.mjs";
import {
  buildRuntimeLoginUrl,
  getManagedAuthRuntime,
} from "../../../features/auth/auth-runtime.mjs";

export const runtime = "nodejs";

const AUTH_FLOW_MAX_AGE_SECONDS = 10 * 60;

export function GET(request: NextRequest) {
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get("returnTo"), {
    currentOrigin: request.nextUrl.origin,
  });
  const authRuntime = getManagedAuthRuntime();

  if (!authRuntime.enabled) {
    return redirectToAuthError(request, "provider_not_configured", returnTo);
  }

  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  const loginHint = request.nextUrl.searchParams.get("loginHint");
  const providerUrl = buildRuntimeLoginUrl(authRuntime.config, {
    state,
    nonce,
    loginHint,
  });
  const response = NextResponse.redirect(providerUrl, 302);

  setAuthFlowCookie(request, response, AUTH_FLOW_COOKIE_NAMES.state, state);
  setAuthFlowCookie(request, response, AUTH_FLOW_COOKIE_NAMES.nonce, nonce);
  setAuthFlowCookie(request, response, AUTH_FLOW_COOKIE_NAMES.returnTo, returnTo);

  return response;
}

function redirectToAuthError(request: NextRequest, code: string, returnTo: string) {
  const errorUrl = new URL(AUTH_ROUTES.error, request.url);
  errorUrl.searchParams.set("code", code);
  errorUrl.searchParams.set("returnTo", returnTo);

  return NextResponse.redirect(errorUrl, 302);
}

function setAuthFlowCookie(
  request: NextRequest,
  response: NextResponse,
  name: string,
  value: string,
) {
  response.cookies.set(name, value, {
    httpOnly: true,
    maxAge: AUTH_FLOW_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
}
