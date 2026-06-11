import assert from "node:assert/strict";
import test from "node:test";

import {
  AUTH_ROUTES,
  createPublicAppUrl,
  getAuthCookieClearNames,
  getAuthErrorDisplay,
  hasAuthenticatedSessionCookie,
  isProtectedPath,
  resolvePublicAppOrigin,
  resolveProtectedRouteRequest,
  sanitizeReturnTo,
} from "./auth-routes.mjs";

test("protected route detection covers app shell routes only", () => {
  assert.equal(isProtectedPath("/app/catalog"), true);
  assert.equal(isProtectedPath("/breeder-dashboard"), true);
  assert.equal(isProtectedPath("/station-dashboard/orders"), true);
  assert.equal(isProtectedPath("/login"), false);
  assert.equal(isProtectedPath("/auth/callback"), false);
});

test("unauthenticated protected requests redirect to login with a safe return target", () => {
  const result = resolveProtectedRouteRequest({
    url: "https://app.coritech.test/app/catalog?listingId=listing-1",
  });

  assert.deepEqual(result, {
    allowed: false,
    redirectTo: "/login?returnTo=%2Fapp%2Fcatalog%3FlistingId%3Dlisting-1",
  });
});

test("authenticated protected requests are allowed by managed session cookie presence", () => {
  const result = resolveProtectedRouteRequest({
    url: "https://app.coritech.test/app/catalog",
    cookieHeader: "__Host-coritech_session=payload.signature",
  });

  assert.deepEqual(result, {
    allowed: true,
    redirectTo: null,
  });
});

test("return targets reject open redirects and auth loops", () => {
  assert.equal(
    sanitizeReturnTo("https://evil.test/app/catalog", {
      currentOrigin: "https://app.coritech.test",
    }),
    AUTH_ROUTES.appHome,
  );
  assert.equal(sanitizeReturnTo("//evil.test"), AUTH_ROUTES.appHome);
  assert.equal(sanitizeReturnTo("/login?returnTo=/app"), AUTH_ROUTES.appHome);
  assert.equal(sanitizeReturnTo("/app/orders/new?listingId=abc"), "/app/orders/new?listingId=abc");
  assert.equal(
    sanitizeReturnTo("https://app.coritech.test/app/catalog", {
      currentOrigin: "https://app.coritech.test",
    }),
    "/app/catalog",
  );
});

test("local public app origin never exposes the server bind host", () => {
  assert.equal(
    resolvePublicAppOrigin({
      requestOrigin: "http://0.0.0.0:3000",
      source: {
        APP_BASE_URL: "http://localhost:3000",
      },
    }),
    "http://localhost:3000",
  );
  assert.equal(
    createPublicAppUrl("/auth/callback", {
      requestOrigin: "http://0.0.0.0:3004",
    }).href,
    "http://localhost:3004/auth/callback",
  );
  assert.equal(
    createPublicAppUrl("/logged-out", {
      source: {
        APP_BASE_URL: "http://0.0.0.0:3000",
      },
    }).href,
    "http://localhost:3000/logged-out",
  );
});

test("protected route redirects normalize local bind host to localhost", () => {
  const result = resolveProtectedRouteRequest({
    url: "http://0.0.0.0:3000/app/catalog",
    currentOrigin: "http://0.0.0.0:3000",
  });

  assert.deepEqual(result, {
    allowed: false,
    redirectTo: "/login?returnTo=%2Fapp%2Fcatalog",
  });
});

test("session detection only accepts shaped managed session cookies", () => {
  assert.equal(hasAuthenticatedSessionCookie("foo=bar"), false);
  assert.equal(hasAuthenticatedSessionCookie("__Host-coritech_session="), false);
  assert.equal(hasAuthenticatedSessionCookie("coritech_session=session-2"), false);
  assert.equal(hasAuthenticatedSessionCookie("coritech_session=payload.signature"), true);
  assert.equal(hasAuthenticatedSessionCookie("__Host-coritech_session=payload.signature"), true);
});

test("logout clearing includes session and auth-flow cookies", () => {
  assert.deepEqual(getAuthCookieClearNames(), [
    "__Host-coritech_session",
    "coritech_session",
    "coritech_auth_state",
    "coritech_auth_nonce",
    "coritech_auth_return_to",
  ]);
});

test("auth errors resolve to user-readable messages", () => {
  assert.match(getAuthErrorDisplay("invalid_state").message, /callbacks/i);
  assert.match(getAuthErrorDisplay("unknown").title, /provider/i);
});
