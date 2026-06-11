import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_ROUTES,
  createPublicAppUrl,
  hasAuthenticatedSessionCookie,
  resolvePublicAppOrigin,
  sanitizeReturnTo,
} from "./features/auth/auth-routes.mjs";

export function middleware(request: NextRequest) {
  if (hasAuthenticatedSessionCookie(request.headers.get("cookie"))) {
    return NextResponse.next();
  }

  const currentOrigin = resolvePublicAppOrigin({
    requestOrigin: request.nextUrl.origin,
  });
  const loginUrl = createPublicAppUrl(AUTH_ROUTES.loginPage, {
    requestOrigin: currentOrigin,
  });
  loginUrl.searchParams.set(
    "returnTo",
    sanitizeReturnTo(`${request.nextUrl.pathname}${request.nextUrl.search}`, {
      currentOrigin,
    }),
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/app/:path*", "/breeder-dashboard/:path*", "/station-dashboard/:path*"],
};
