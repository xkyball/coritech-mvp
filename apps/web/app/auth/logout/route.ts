import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_ROUTES,
  getAuthCookieClearNames,
} from "../../../features/auth/auth-routes.mjs";
import {
  buildRuntimeLogoutUrl,
  getManagedAuthRuntime,
} from "../../../features/auth/auth-runtime.mjs";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL(AUTH_ROUTES.logoutPage, request.url), 302);
}

export function POST(request: NextRequest) {
  const authRuntime = getManagedAuthRuntime();
  const fallbackUrl = new URL(AUTH_ROUTES.loggedOut, request.url);
  fallbackUrl.searchParams.set("status", "local-session-cleared");

  let destination = fallbackUrl.href;

  if (authRuntime.enabled) {
    destination = buildRuntimeLogoutUrl(authRuntime.config, {
      returnTo: new URL(AUTH_ROUTES.loggedOut, request.url).href,
    });
  }

  const response = NextResponse.redirect(destination, 303);

  for (const name of getAuthCookieClearNames()) {
    response.cookies.set(name, "", {
      maxAge: 0,
      path: "/",
    });
  }

  return response;
}
