import { NextRequest, NextResponse } from "next/server";

import { AUTH_ROUTES } from "../../../features/auth/auth-routes.mjs";
import {
  getManagedAuthRuntime,
  prepareRuntimePasswordResetRequest,
} from "../../../features/auth/auth-runtime.mjs";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const redirectUrl = new URL(AUTH_ROUTES.passwordResetPage, request.url);

  if (!isEmailLike(email)) {
    redirectUrl.searchParams.set("status", "invalid-email");

    return NextResponse.redirect(redirectUrl, 303);
  }

  const authRuntime = getManagedAuthRuntime();

  if (!authRuntime.enabled) {
    redirectUrl.searchParams.set("status", "provider-not-configured");

    return NextResponse.redirect(redirectUrl, 303);
  }

  prepareRuntimePasswordResetRequest(authRuntime.config, { email });
  redirectUrl.searchParams.set("status", "provider-managed");

  return NextResponse.redirect(redirectUrl, 303);
}

function isEmailLike(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
