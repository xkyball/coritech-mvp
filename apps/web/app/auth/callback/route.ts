import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_FLOW_COOKIE_NAMES,
  AUTH_ROUTES,
  createPublicAppUrl,
  resolvePublicAppOrigin,
  sanitizeReturnTo,
} from "../../../features/auth/auth-routes.mjs";
import {
  exchangeGoogleAuthorizationCode,
  GoogleAuthRuntimeError,
  isGoogleManagedAuthConfig,
  verifyGoogleIdToken,
} from "../../../features/auth/google-auth-runtime.mjs";
import {
  getManagedAuthRuntime,
} from "../../../features/auth/auth-runtime.mjs";
import {
  createManagedAuthSessionForIdentity,
  ManagedAuthSessionError,
} from "../../../features/auth/server-session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const currentOrigin = resolvePublicAppOrigin({
    requestOrigin: request.nextUrl.origin,
  });
  const providerError = request.nextUrl.searchParams.get("error");
  const returnTo = sanitizeReturnTo(
    request.cookies.get(AUTH_FLOW_COOKIE_NAMES.returnTo)?.value,
    {
      currentOrigin,
    },
  );

  if (providerError) {
    if (providerError.toLowerCase().includes("verif")) {
      const verificationUrl = createPublicAppUrl(AUTH_ROUTES.emailVerificationPage, {
        requestOrigin: currentOrigin,
      });
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

  const authRuntime = getManagedAuthRuntime();

  if (!authRuntime.enabled) {
    return redirectToAuthError(request, "provider_not_configured", returnTo);
  }

  if (!isGoogleManagedAuthConfig(authRuntime.config)) {
    return redirectToAuthError(request, "session_adapter_pending", returnTo);
  }

  try {
    const tokenResponse = await exchangeGoogleAuthorizationCode(authRuntime.config, {
      code,
      clientSecret: process.env.AUTH_PROVIDER_CLIENT_SECRET,
    });
    const identity = await verifyGoogleIdToken(authRuntime.config, {
      idToken: tokenResponse.idToken,
      nonce: request.cookies.get(AUTH_FLOW_COOKIE_NAMES.nonce)?.value,
    });
    const managedSession = await createManagedAuthSessionForIdentity(
      identity,
      authRuntime.config,
    );
    const response = NextResponse.redirect(createPublicAppUrl(returnTo, {
      requestOrigin: currentOrigin,
    }), 302);

    clearAuthFlowCookies(response);
    response.cookies.set(managedSession.cookieName, managedSession.cookieValue, {
      httpOnly: true,
      maxAge: managedSession.maxAgeSeconds,
      path: "/",
      sameSite: "lax",
      secure: authRuntime.config.sessionCookie.secure,
    });

    return response;
  } catch (error) {
    if (error instanceof GoogleAuthRuntimeError) {
      return redirectToAuthError(request, error.code, returnTo);
    }

    if (error instanceof ManagedAuthSessionError) {
      return redirectToAuthError(request, error.code, returnTo);
    }

    return redirectToAuthError(request, "provider_error", returnTo);
  }
}

function redirectToAuthError(request: NextRequest, code: string, returnTo: string) {
  const errorUrl = createPublicAppUrl(AUTH_ROUTES.error, {
    requestOrigin: request.nextUrl.origin,
  });
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
