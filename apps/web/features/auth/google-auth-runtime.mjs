// @ts-check

import { webcrypto } from "node:crypto";

const GOOGLE_TOKEN_ISSUERS = new Set([
  "accounts.google.com",
  "https://accounts.google.com",
]);

const CLOCK_SKEW_SECONDS = 300;

export class GoogleAuthRuntimeError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = "GoogleAuthRuntimeError";
    this.code = code;
  }
}

/**
 * @param {import("@coritech/domain/auth/managed-auth-provider.d.ts").ManagedAuthProviderConfig} config
 * @returns {boolean}
 */
export function isGoogleManagedAuthConfig(config) {
  if (config.providerFlavor === "GOOGLE_OIDC") {
    return true;
  }

  try {
    return new URL(config.issuerBaseUrl).hostname === "accounts.google.com";
  } catch {
    return false;
  }
}

/**
 * @param {import("@coritech/domain/auth/managed-auth-provider.d.ts").ManagedAuthProviderConfig} config
 * @param {{
 *   code: string,
 *   clientSecret: string | undefined,
 * }} input
 * @param {{ fetchFn?: typeof fetch }} [options]
 * @returns {Promise<import("./google-auth-runtime.d.ts").GoogleAuthTokenResponse>}
 */
export async function exchangeGoogleAuthorizationCode(config, input, options = {}) {
  if (!isGoogleManagedAuthConfig(config)) {
    throw new GoogleAuthRuntimeError(
      "unsupported_provider",
      "Google auth callback can only handle Google OIDC provider configuration.",
    );
  }

  const code = normalizeString(input.code);
  const clientSecret = normalizeString(input.clientSecret);

  if (!code) {
    throw new GoogleAuthRuntimeError("invalid_callback", "Google callback did not include a code.");
  }

  if (!clientSecret) {
    throw new GoogleAuthRuntimeError(
      "provider_not_configured",
      "Google OAuth client secret is not configured.",
    );
  }

  const form = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: clientSecret,
    redirect_uri: config.callbackUrl,
    grant_type: "authorization_code",
  });
  const fetchFn = options.fetchFn ?? fetch;
  const response = await fetchFn(config.tokenEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: form,
  });

  let body;

  try {
    body = await response.json();
  } catch {
    body = {};
  }

  if (!response.ok) {
    throw new GoogleAuthRuntimeError(
      "token_exchange_failed",
      "Google rejected the authorization-code exchange.",
    );
  }

  const idToken = normalizeString(body.id_token);

  if (!idToken) {
    throw new GoogleAuthRuntimeError(
      "invalid_id_token",
      "Google token response did not include an ID token.",
    );
  }

  return {
    idToken,
    accessToken: normalizeString(body.access_token),
    expiresIn: Number.isFinite(body.expires_in) ? body.expires_in : null,
    scope: normalizeString(body.scope),
    tokenType: normalizeString(body.token_type),
  };
}

/**
 * @param {import("@coritech/domain/auth/managed-auth-provider.d.ts").ManagedAuthProviderConfig} config
 * @param {{
 *   idToken: string,
 *   nonce?: string | null,
 *   now?: Date,
 * }} input
 * @param {{ fetchFn?: typeof fetch }} [options]
 * @returns {Promise<import("@coritech/domain/auth/managed-auth-provider.d.ts").ManagedAuthProviderIdentity>}
 */
export async function verifyGoogleIdToken(config, input, options = {}) {
  if (!isGoogleManagedAuthConfig(config)) {
    throw new GoogleAuthRuntimeError(
      "unsupported_provider",
      "Google ID token validation requires Google OIDC provider configuration.",
    );
  }

  const jwt = parseJwt(input.idToken);

  if (jwt.header.alg !== "RS256" || !normalizeString(jwt.header.kid)) {
    throw new GoogleAuthRuntimeError(
      "invalid_id_token",
      "Google ID token header is not supported.",
    );
  }

  const jwk = await fetchGoogleSigningKey(config.jwksUri, jwt.header.kid, options.fetchFn ?? fetch);
  const key = await webcrypto.subtle.importKey(
    "jwk",
    {
      kty: jwk.kty,
      n: jwk.n,
      e: jwk.e,
      alg: "RS256",
      ext: true,
    },
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["verify"],
  );
  const verified = await webcrypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlToBytes(jwt.signatureSegment),
    new TextEncoder().encode(`${jwt.headerSegment}.${jwt.payloadSegment}`),
  );

  if (!verified) {
    throw new GoogleAuthRuntimeError(
      "invalid_id_token",
      "Google ID token signature could not be verified.",
    );
  }

  validateGoogleClaims(jwt.payload, config, input.nonce, input.now ?? new Date());

  return {
    subject: `google|${jwt.payload.sub}`,
    email: jwt.payload.email,
    emailVerified: jwt.payload.email_verified === true,
    name: normalizeString(jwt.payload.name),
    givenName: normalizeString(jwt.payload.given_name),
    familyName: normalizeString(jwt.payload.family_name),
  };
}

/**
 * @param {string} jwksUri
 * @param {unknown} keyId
 * @param {typeof fetch} fetchFn
 * @returns {Promise<JsonWebKey & { kid?: string }>}
 */
async function fetchGoogleSigningKey(jwksUri, keyId, fetchFn) {
  const response = await fetchFn(jwksUri, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new GoogleAuthRuntimeError(
      "jwks_fetch_failed",
      "Google signing keys could not be fetched.",
    );
  }

  const body = await response.json();
  const keys = Array.isArray(body.keys) ? body.keys : [];
  const key = keys.find((candidate) =>
    candidate &&
    typeof candidate === "object" &&
    candidate.kid === keyId &&
    candidate.kty === "RSA" &&
    candidate.n &&
    candidate.e
  );

  if (!key) {
    throw new GoogleAuthRuntimeError(
      "invalid_id_token",
      "Google ID token signing key was not found.",
    );
  }

  return key;
}

/**
 * @param {import("./google-auth-runtime.d.ts").GoogleIdTokenPayload} payload
 * @param {import("@coritech/domain/auth/managed-auth-provider.d.ts").ManagedAuthProviderConfig} config
 * @param {string | null | undefined} nonce
 * @param {Date} now
 * @returns {void}
 */
function validateGoogleClaims(payload, config, nonce, now) {
  const issues = [];
  const nowSeconds = Math.floor(now.getTime() / 1000);

  if (!GOOGLE_TOKEN_ISSUERS.has(payload.iss)) {
    issues.push("issuer");
  }

  if (!matchesAudience(payload.aud, config.clientId)) {
    issues.push("audience");
  }

  if (!Number.isFinite(payload.exp) || payload.exp <= nowSeconds - CLOCK_SKEW_SECONDS) {
    issues.push("expiry");
  }

  if (Number.isFinite(payload.iat) && payload.iat > nowSeconds + CLOCK_SKEW_SECONDS) {
    issues.push("issued-at");
  }

  if (nonce && payload.nonce !== nonce) {
    issues.push("nonce");
  }

  if (!normalizeString(payload.sub)) {
    issues.push("subject");
  }

  if (!normalizeEmail(payload.email)) {
    issues.push("email");
  }

  if (payload.email_verified !== true) {
    issues.push("email-verification");
  }

  if (issues.length > 0) {
    throw new GoogleAuthRuntimeError(
      "invalid_id_token",
      "Google ID token claims could not be validated.",
    );
  }
}

/**
 * @param {unknown} audience
 * @param {string} clientId
 * @returns {boolean}
 */
function matchesAudience(audience, clientId) {
  if (typeof audience === "string") {
    return audience === clientId;
  }

  return Array.isArray(audience) && audience.includes(clientId);
}

/**
 * @param {string} token
 * @returns {{
 *   headerSegment: string,
 *   payloadSegment: string,
 *   signatureSegment: string,
 *   header: import("./google-auth-runtime.d.ts").JwtHeader,
 *   payload: import("./google-auth-runtime.d.ts").GoogleIdTokenPayload,
 * }}
 */
function parseJwt(token) {
  const [headerSegment, payloadSegment, signatureSegment, extra] = token.split(".");

  if (!headerSegment || !payloadSegment || !signatureSegment || extra !== undefined) {
    throw new GoogleAuthRuntimeError("invalid_id_token", "Google ID token is not a JWT.");
  }

  let header;
  let payload;

  try {
    header = JSON.parse(Buffer.from(headerSegment, "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8"));
  } catch {
    throw new GoogleAuthRuntimeError(
      "invalid_id_token",
      "Google ID token could not be decoded.",
    );
  }

  return {
    headerSegment,
    payloadSegment,
    signatureSegment,
    header,
    payload,
  };
}

/**
 * @param {string} value
 * @returns {Uint8Array}
 */
function base64UrlToBytes(value) {
  return Buffer.from(value, "base64url");
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeEmail(value) {
  const normalized = normalizeString(value).toLowerCase();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : "";
}
