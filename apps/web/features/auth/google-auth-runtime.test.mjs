import assert from "node:assert/strict";
import { createSign, generateKeyPairSync } from "node:crypto";
import test from "node:test";

import {
  exchangeGoogleAuthorizationCode,
  GoogleAuthRuntimeError,
  verifyGoogleIdToken,
} from "./google-auth-runtime.mjs";

const config = {
  kind: "OIDC_MANAGED_AUTH",
  providerFlavor: "GOOGLE_OIDC",
  issuerBaseUrl: "https://accounts.google.com",
  clientId: "coritech-google-client",
  clientSecretEnvironmentKey: "AUTH_PROVIDER_CLIENT_SECRET",
  clientSecretConfigured: true,
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  logoutEndpoint: null,
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
  userinfoEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",
  jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
  openidConfigurationUrl: "https://accounts.google.com/.well-known/openid-configuration",
  callbackUrl: "https://app.coritech.test/auth/callback",
  logoutReturnUrl: "https://app.coritech.test/logged-out",
  defaultPostLoginUrl: "https://app.coritech.test/app",
  scope: ["openid", "profile", "email"],
  sessionCookie: {
    name: "__Host-coritech_session",
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    secure: true,
    maxAgeSeconds: 28800,
  },
  passwordHandling: {
    handledBy: "MANAGED_AUTH_PROVIDER",
    customPasswordStorage: false,
    customPasswordHashing: false,
    customPasswordResetTokens: false,
    localPasswordFieldsAllowed: false,
    reason: "test",
  },
  adminMfa: {
    requiredForRoles: ["PLATFORM_ADMIN"],
    enforcement: "MANAGED_AUTH_PROVIDER_TENANT_POLICY",
    documentationPath: "docs/security/managed-auth-provider.md",
  },
  providerAccountOwnership: {
    requiredOwner: "CoriTech",
    vendorOwnedProductionAccountAllowed: false,
    evidenceDocument: "docs/vendor-ip/account-ownership-checklist.md",
  },
};

test("exchangeGoogleAuthorizationCode posts the auth code to Google's token endpoint", async () => {
  let capturedUrl = "";
  let capturedBody = "";

  const tokenResponse = await exchangeGoogleAuthorizationCode(
    config,
    {
      code: "code-1",
      clientSecret: "secret-1",
    },
    {
      fetchFn: async (url, options) => {
        capturedUrl = String(url);
        capturedBody = String(options?.body);

        return {
          ok: true,
          async json() {
            return {
              id_token: "id-token-1",
              access_token: "access-token-1",
              expires_in: 3600,
              scope: "openid profile email",
              token_type: "Bearer",
            };
          },
        };
      },
    },
  );

  assert.equal(capturedUrl, "https://oauth2.googleapis.com/token");
  assert.match(capturedBody, /code=code-1/);
  assert.match(capturedBody, /client_id=coritech-google-client/);
  assert.match(capturedBody, /client_secret=secret-1/);
  assert.match(capturedBody, /grant_type=authorization_code/);
  assert.equal(tokenResponse.idToken, "id-token-1");
});

test("verifyGoogleIdToken validates signature and maps Google subject to CoriTech identity", async () => {
  const { token, jwk } = createSignedGoogleToken();

  const identity = await verifyGoogleIdToken(
    config,
    {
      idToken: token,
      nonce: "nonce-1",
      now: new Date("2026-06-10T10:00:00.000Z"),
    },
    {
      fetchFn: async () => ({
        ok: true,
        async json() {
          return { keys: [jwk] };
        },
      }),
    },
  );

  assert.deepEqual(identity, {
    subject: "google|google-subject-1",
    email: "breeder@coritech.test",
    emailVerified: true,
    name: "Blue Oak Breeder",
    givenName: "Blue",
    familyName: "Breeder",
  });
});

test("verifyGoogleIdToken rejects an ID token for a different client", async () => {
  const { token, jwk } = createSignedGoogleToken({
    aud: "another-client",
  });

  await assert.rejects(
    () =>
      verifyGoogleIdToken(
        config,
        {
          idToken: token,
          nonce: "nonce-1",
          now: new Date("2026-06-10T10:00:00.000Z"),
        },
        {
          fetchFn: async () => ({
            ok: true,
            async json() {
              return { keys: [jwk] };
            },
          }),
        },
      ),
    (error) =>
      error instanceof GoogleAuthRuntimeError &&
      error.code === "invalid_id_token",
  );
});

function createSignedGoogleToken(overrides = {}) {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const kid = "test-key-1";
  const jwk = {
    ...publicKey.export({ format: "jwk" }),
    kid,
    alg: "RS256",
    use: "sig",
  };
  const header = {
    alg: "RS256",
    kid,
    typ: "JWT",
  };
  const payload = {
    iss: "https://accounts.google.com",
    aud: "coritech-google-client",
    exp: Math.floor(new Date("2026-06-10T10:30:00.000Z").getTime() / 1000),
    iat: Math.floor(new Date("2026-06-10T09:59:00.000Z").getTime() / 1000),
    sub: "google-subject-1",
    email: "breeder@coritech.test",
    email_verified: true,
    nonce: "nonce-1",
    name: "Blue Oak Breeder",
    given_name: "Blue",
    family_name: "Breeder",
    ...overrides,
  };
  const headerSegment = encodeJson(header);
  const payloadSegment = encodeJson(payload);
  const signature = createSign("RSA-SHA256")
    .update(`${headerSegment}.${payloadSegment}`)
    .sign(privateKey)
    .toString("base64url");

  return {
    jwk,
    token: `${headerSegment}.${payloadSegment}.${signature}`,
  };
}

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}
