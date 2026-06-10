import { NextRequest, NextResponse } from "next/server";

import {
  ACTIVE_CONTEXT_COOKIE_NAME,
  resolveActiveContextSwitch,
} from "../../../../features/auth/active-context-runtime.mjs";
import {
  AUTH_ROUTES,
  hasAuthenticatedSessionCookie,
} from "../../../../features/auth/auth-routes.mjs";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  if (!hasAuthenticatedSessionCookie(request.headers.get("cookie"))) {
    return NextResponse.redirect(new URL(AUTH_ROUTES.loginPage, request.url), 303);
  }

  const result = resolveActiveContextSwitch({
    session: null,
    selectedContextKey: formData.get("activeContextKey"),
  });

  const redirectUrl = new URL(AUTH_ROUTES.noRole, request.url);
  redirectUrl.searchParams.set("status", "context-switch-requires-server-session");
  redirectUrl.searchParams.set("reason", result.reason);
  const response = NextResponse.redirect(redirectUrl, 303);

  response.cookies.set(ACTIVE_CONTEXT_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });

  return response;
}
