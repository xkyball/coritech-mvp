import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_ROUTES,
  hasAuthenticatedSessionCookie,
  sanitizeReturnTo,
} from "./features/auth/auth-routes.mjs";

export function middleware(request: NextRequest) {
  if (hasAuthenticatedSessionCookie(request.headers.get("cookie"))) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = AUTH_ROUTES.loginPage;
  loginUrl.search = "";
  loginUrl.searchParams.set(
    "returnTo",
    sanitizeReturnTo(`${request.nextUrl.pathname}${request.nextUrl.search}`, {
      currentOrigin: request.nextUrl.origin,
    }),
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/app/:path*", "/breeder-dashboard/:path*", "/station-dashboard/:path*"],
};
