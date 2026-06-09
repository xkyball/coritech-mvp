import test from "node:test";
import assert from "node:assert/strict";

import { loadEnvironment } from "@coritech/config/environment";
import {
  ADMIN_MFA_POLICY,
  AUTH_PROVIDER_ACCOUNT_OWNERSHIP_POLICY,
  MANAGED_AUTH_ROUTES,
  ManagedAuthConfigError,
  ManagedAuthValidationError,
  PASSWORD_HANDLING_POLICY,
  buildManagedAuthLoginUrl,
  buildManagedAuthLogoutUrl,
  buildManagedAuthSignUpUrl,
  createManagedAuthProviderConfig,
  mapManagedAuthIdentityToInternalUser,
  prepareManagedAuthEmailVerificationRequest,
  prepareManagedAuthPasswordResetRequest,
  prepareManagedAuthSession,
} from "./managed-auth-provider.mjs";

function buildEnvironment(overrides = {}) {
  return loadEnvironment({
    CORITECH_ENVIRONMENT: "staging",
    DATABASE_URL: "postgresql://db.internal:5432/coritech",
    AUTH_PROVIDER_CLIENT_ID: "coritech-staging-client",
    AUTH_PROVIDER_CLIENT_SECRET: "coritech-staging-secret",
    AUTH_PROVIDER_DOMAIN: "auth.coritech.test",
    EMAIL_PROVIDER_API_KEY: "staging-email-key",
    OBJECT_STORAGE_BUCKET: "coritech-staging-bucket",
    OBJECT_STORAGE_ACCESS_KEY: "staging-storage-user",
    OBJECT_STORAGE_SECRET_KEY: "staging-storage-secret",
    PAYMENT_PROVIDER_SECRET: "staging-payment-secret",
    LOGISTICS_PROVIDER_API_KEY: "staging-logistics-key",
    APP_BASE_URL: "https://staging.app.coritech.test",
    API_BASE_URL: "https://staging.api.coritech.test",
    AUDIT_LOG_RETENTION_DAYS: "90",
    ...overrides,
  });
}

test("createManagedAuthProviderConfig builds environment-based provider endpoints without exposing the client secret", () => {
  const config = createManagedAuthProviderConfig(buildEnvironment());

  assert.equal(config.kind, "OIDC_MANAGED_AUTH");
  assert.equal(config.issuerBaseUrl, "https://auth.coritech.test");
  assert.equal(config.authorizationEndpoint, "https://auth.coritech.test/authorize");
  assert.equal(config.tokenEndpoint, "https://auth.coritech.test/oauth/token");
  assert.equal(config.logoutEndpoint, "https://auth.coritech.test/v2/logout");
  assert.equal(config.callbackUrl, "https://staging.api.coritech.test/auth/callback");
  assert.equal(config.logoutReturnUrl, "https://staging.app.coritech.test/logged-out");
  assert.equal(config.clientSecretEnvironmentKey, "AUTH_PROVIDER_CLIENT_SECRET");
  assert.equal(config.clientSecretConfigured, true);
  assert.deepEqual(config.scope, ["openid", "profile", "email"]);
  assert.equal(config.sessionCookie.httpOnly, true);
  assert.equal(config.sessionCookie.secure, true);
});

test("createManagedAuthProviderConfig rejects placeholder provider values before auth routes are enabled", () => {
  assert.throws(
    () =>
      createManagedAuthProviderConfig(
        buildEnvironment({
          CORITECH_ENVIRONMENT: "local",
          AUTH_PROVIDER_CLIENT_ID: "replace-before-managed-auth-setup",
          AUTH_PROVIDER_CLIENT_SECRET: "replace-before-managed-auth-setup",
          AUTH_PROVIDER_DOMAIN: "replace-before-managed-auth-setup",
        }),
      ),
    (error) =>
      error instanceof ManagedAuthConfigError &&
      error.issues.some((issue) =>
        issue.includes("AUTH_PROVIDER_DOMAIN must be replaced"),
      ),
  );
});

test("managed auth routes cover signup, login, callback, logout, password reset, verification and session", () => {
  assert.deepEqual(
    MANAGED_AUTH_ROUTES.map((route) => `${route.method} ${route.path}`),
    [
      "GET /auth/signup",
      "GET /auth/login",
      "GET /auth/callback",
      "POST /auth/logout",
      "POST /auth/password-reset",
      "POST /auth/email-verification",
      "GET /auth/session",
    ],
  );
});

test("buildManagedAuthLoginUrl and buildManagedAuthSignUpUrl delegate credential collection to the provider", () => {
  const config = createManagedAuthProviderConfig(buildEnvironment());
  const loginUrl = new URL(
    buildManagedAuthLoginUrl(config, {
      state: "state-login",
      nonce: "nonce-login",
      loginHint: "Breeder@Coritech.test",
    }),
  );
  const signUpUrl = new URL(
    buildManagedAuthSignUpUrl(config, {
      state: "state-signup",
      nonce: "nonce-signup",
    }),
  );

  assert.equal(loginUrl.origin, "https://auth.coritech.test");
  assert.equal(loginUrl.pathname, "/authorize");
  assert.equal(loginUrl.searchParams.get("response_type"), "code");
  assert.equal(loginUrl.searchParams.get("client_id"), "coritech-staging-client");
  assert.equal(
    loginUrl.searchParams.get("redirect_uri"),
    "https://staging.api.coritech.test/auth/callback",
  );
  assert.equal(loginUrl.searchParams.get("scope"), "openid profile email");
  assert.equal(loginUrl.searchParams.get("state"), "state-login");
  assert.equal(loginUrl.searchParams.get("nonce"), "nonce-login");
  assert.equal(loginUrl.searchParams.get("login_hint"), "Breeder@Coritech.test");
  assert.equal(loginUrl.searchParams.has("screen_hint"), false);

  assert.equal(signUpUrl.searchParams.get("screen_hint"), "signup");
  assert.equal(PASSWORD_HANDLING_POLICY.customPasswordStorage, false);
  assert.equal(PASSWORD_HANDLING_POLICY.customPasswordHashing, false);
});

test("buildManagedAuthLogoutUrl delegates logout to the provider", () => {
  const config = createManagedAuthProviderConfig(buildEnvironment());
  const logoutUrl = new URL(buildManagedAuthLogoutUrl(config));

  assert.equal(logoutUrl.origin, "https://auth.coritech.test");
  assert.equal(logoutUrl.pathname, "/v2/logout");
  assert.equal(logoutUrl.searchParams.get("client_id"), "coritech-staging-client");
  assert.equal(
    logoutUrl.searchParams.get("returnTo"),
    "https://staging.app.coritech.test/logged-out",
  );
});

test("password reset and email verification requests do not create CoriTech password tokens", () => {
  const config = createManagedAuthProviderConfig(buildEnvironment());

  const reset = prepareManagedAuthPasswordResetRequest(config, {
    email: "BREEDER@CORITECH.TEST",
  });
  const verification = prepareManagedAuthEmailVerificationRequest(config, {
    subject: "auth0|breeder-1",
    email: "breeder@coritech.test",
  });

  assert.equal(reset.action, "PASSWORD_RESET");
  assert.equal(reset.handledByProvider, true);
  assert.equal(reset.passwordHandledBy, "MANAGED_AUTH_PROVIDER");
  assert.equal(reset.customPasswordTokenCreated, false);
  assert.equal(reset.userEmail, "breeder@coritech.test");

  assert.equal(verification.action, "EMAIL_VERIFICATION");
  assert.equal(verification.handledByProvider, true);
  assert.equal(verification.subject, "auth0|breeder-1");
  assert.equal(verification.customPasswordTokenCreated, false);
});

test("mapManagedAuthIdentityToInternalUser maps provider subject and email to the internal user shape", () => {
  const mappedUser = mapManagedAuthIdentityToInternalUser({
    userId: "user-breeder",
    identity: {
      subject: "auth0|breeder-1",
      email: "BREEDER@CORITECH.TEST",
      emailVerified: true,
      givenName: "Ada",
      familyName: "Stable",
    },
    now: "2026-06-09T08:00:00.000Z",
  });

  assert.deepEqual(mappedUser, {
    id: "user-breeder",
    managedAuthSubject: "auth0|breeder-1",
    email: "breeder@coritech.test",
    displayName: "Ada Stable",
    status: "ACTIVE",
    createdAt: "2026-06-09T08:00:00.000Z",
    updatedAt: "2026-06-09T08:00:00.000Z",
  });
});

test("mapManagedAuthIdentityToInternalUser rejects mismatched existing user subjects", () => {
  assert.throws(
    () =>
      mapManagedAuthIdentityToInternalUser({
        identity: {
          subject: "auth0|incoming",
          email: "breeder@coritech.test",
        },
        existingUser: {
          id: "user-existing",
          managedAuthSubject: "auth0|existing",
          email: "breeder@coritech.test",
          displayName: "Breeder",
          status: "ACTIVE",
          createdAt: "2026-06-01T08:00:00.000Z",
          updatedAt: "2026-06-01T08:00:00.000Z",
        },
      }),
    (error) =>
      error instanceof ManagedAuthValidationError &&
      error.issues.includes(
        "existingUser.managedAuthSubject must match identity.subject.",
      ),
  );
});

test("prepareManagedAuthSession creates session context with active organization memberships", () => {
  const session = prepareManagedAuthSession({
    sessionId: "session-1",
    providerSessionId: "provider-session-1",
    issuedAt: "2026-06-09T08:00:00.000Z",
    expiresAt: "2026-06-09T16:00:00.000Z",
    user: {
      id: "user-breeder",
      managedAuthSubject: "auth0|breeder-1",
      email: "breeder@coritech.test",
      displayName: "Breeder",
      status: "ACTIVE",
    },
    roleAssignments: [
      {
        userId: "user-breeder",
        organizationId: "org-breeder",
        roleCode: "BREEDER",
        revokedAt: null,
      },
      {
        userId: "user-breeder",
        organizationId: "org-disabled",
        roleCode: "BREEDER",
        revokedAt: "2026-06-09T07:00:00.000Z",
      },
      {
        userId: "user-other",
        organizationId: "org-other",
        roleCode: "BREEDER",
        revokedAt: null,
      },
    ],
  });

  assert.deepEqual(session, {
    id: "session-1",
    user: {
      id: "user-breeder",
      managedAuthSubject: "auth0|breeder-1",
      email: "breeder@coritech.test",
      displayName: "Breeder",
      status: "ACTIVE",
    },
    providerSessionId: "provider-session-1",
    memberships: [
      {
        organizationId: "org-breeder",
        roles: ["BREEDER"],
      },
    ],
    issuedAt: "2026-06-09T08:00:00.000Z",
    expiresAt: "2026-06-09T16:00:00.000Z",
  });
});

test("prepareManagedAuthSession rejects disabled users", () => {
  assert.throws(
    () =>
      prepareManagedAuthSession({
        user: {
          id: "user-disabled",
          managedAuthSubject: "auth0|disabled",
          email: "disabled@coritech.test",
          displayName: "Disabled",
          status: "DISABLED",
        },
        now: "2026-06-09T08:00:00.000Z",
      }),
    (error) =>
      error instanceof ManagedAuthValidationError &&
      error.issues.includes(
        "user.status must be ACTIVE to create a managed auth session.",
      ),
  );
});

test("admin MFA and provider account ownership policies are explicit", () => {
  assert.deepEqual(ADMIN_MFA_POLICY.requiredForRoles, ["PLATFORM_ADMIN"]);
  assert.equal(ADMIN_MFA_POLICY.enforcement, "MANAGED_AUTH_PROVIDER_TENANT_POLICY");
  assert.equal(AUTH_PROVIDER_ACCOUNT_OWNERSHIP_POLICY.requiredOwner, "CoriTech");
  assert.equal(
    AUTH_PROVIDER_ACCOUNT_OWNERSHIP_POLICY.vendorOwnedProductionAccountAllowed,
    false,
  );
});
