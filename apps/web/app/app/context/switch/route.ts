import { NextRequest, NextResponse } from "next/server";

import { AUTH_ROUTES } from "../../../../features/auth/auth-routes.mjs";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await request.formData();

  const redirectUrl = new URL(AUTH_ROUTES.noRole, request.url);
  redirectUrl.searchParams.set("status", "context-switch-requires-server-session");

  return NextResponse.redirect(redirectUrl, 303);
}
