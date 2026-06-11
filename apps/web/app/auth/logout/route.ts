import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_ROUTES,
  createPublicAppUrl,
  getAuthCookieClearNames,
  resolvePublicAppOrigin,
} from "../../../features/auth/auth-routes.mjs";
import {
  buildRuntimeLogoutUrl,
  getManagedAuthRuntime,
} from "../../../features/auth/auth-runtime.mjs";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return NextResponse.redirect(createPublicAppUrl(AUTH_ROUTES.logoutPage, {
    requestOrigin: request.nextUrl.origin,
  }), 302);
}

export function POST(request: NextRequest) {
  const currentOrigin = resolvePublicAppOrigin({
    requestOrigin: request.nextUrl.origin,
  });
  const authRuntime = getManagedAuthRuntime();
  const fallbackUrl = createPublicAppUrl(AUTH_ROUTES.loggedOut, {
    requestOrigin: currentOrigin,
  });
  fallbackUrl.searchParams.set("status", "local-session-cleared");

  let destination = fallbackUrl.href;

  if (authRuntime.enabled) {
    destination = buildRuntimeLogoutUrl(authRuntime.config, {
      returnTo: createPublicAppUrl(AUTH_ROUTES.loggedOut, {
        requestOrigin: currentOrigin,
      }).href,
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
