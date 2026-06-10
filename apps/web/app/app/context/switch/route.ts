import { NextRequest, NextResponse } from "next/server";

import {
  ACTIVE_CONTEXT_COOKIE_NAME,
  resolveActiveContextSwitch,
} from "../../../../features/auth/active-context-runtime.mjs";
import {
  AUTH_ROUTES,
} from "../../../../features/auth/auth-routes.mjs";
import { readManagedAuthSessionFromCookieHeader } from "../../../../features/auth/server-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const session = await readManagedAuthSessionFromCookieHeader(request.headers.get("cookie"));

  if (!session) {
    return NextResponse.redirect(new URL(AUTH_ROUTES.loginPage, request.url), 303);
  }

  const result = resolveActiveContextSwitch({
    session,
    selectedContextKey: formData.get("activeContextKey"),
  });

  const redirectUrl = new URL(result.redirectTo, request.url);
  redirectUrl.searchParams.set("reason", result.reason);
  const response = NextResponse.redirect(redirectUrl, 303);

  response.cookies.set(ACTIVE_CONTEXT_COOKIE_NAME, result.cookieValue, {
    httpOnly: true,
    maxAge: result.ok ? 8 * 60 * 60 : 0,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });

  return response;
}
