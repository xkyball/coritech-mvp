import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { prisma } from "@coritech/database";
import {
  mapManagedAuthIdentityToInternalUser,
  prepareManagedAuthSession,
} from "@coritech/domain/auth/managed-auth-provider.mjs";
import type {
  ManagedAuthProviderConfig,
  ManagedAuthProviderIdentity,
  ManagedAuthSessionContext,
} from "@coritech/domain/auth/managed-auth-provider.d.ts";

import {
  SESSION_COOKIE_NAMES,
} from "./auth-routes.mjs";
import { getManagedAuthRuntime } from "./auth-runtime.mjs";

const SESSION_PAYLOAD_VERSION = 1;
const PLACEHOLDER_VALUE_PATTERNS = [
  /\[pending/i,
  /changeme/i,
  /example/i,
  /placeholder/i,
  /replace-/i,
  /^todo$/i,
];

type SessionCookiePayload = {
  v: typeof SESSION_PAYLOAD_VERSION;
  sid: string;
  userId: string;
  sub: string;
  iat: number;
  exp: number;
};

type SessionCookieIssue =
  | "account_disabled"
  | "account_not_linked"
  | "session_secret_missing"
  | "session_creation_failed";

export class ManagedAuthSessionError extends Error {
  readonly code: SessionCookieIssue;

  constructor(code: SessionCookieIssue, message: string) {
    super(message);
    this.name = "ManagedAuthSessionError";
    this.code = code;
  }
}

export async function createManagedAuthSessionForIdentity(
  identity: ManagedAuthProviderIdentity,
  config: ManagedAuthProviderConfig,
  source: Record<string, string | undefined> | NodeJS.ProcessEnv = process.env,
): Promise<{
  cookieName: string;
  cookieValue: string;
  maxAgeSeconds: number;
  session: ManagedAuthSessionContext;
}> {
  const user = await upsertUserFromManagedIdentity(
    identity,
    source.CORITECH_ENVIRONMENT === "local",
  );
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + config.sessionCookie.maxAgeSeconds * 1000);
  const session = await buildSessionContext({
    user,
    sessionId: randomUUID(),
    providerSessionId: identity.subject,
    issuedAt,
    expiresAt,
  });
  const payload: SessionCookiePayload = {
    v: SESSION_PAYLOAD_VERSION,
    sid: session.id ?? randomUUID(),
    userId: session.user.id,
    sub: session.user.managedAuthSubject,
    iat: Math.floor(new Date(session.issuedAt).getTime() / 1000),
    exp: Math.floor(new Date(session.expiresAt).getTime() / 1000),
  };
  const cookieValue = signSessionPayload(payload, source);

  return {
    cookieName: config.sessionCookie.name,
    cookieValue,
    maxAgeSeconds: config.sessionCookie.maxAgeSeconds,
    session,
  };
}

export async function readManagedAuthSessionFromCookieHeader(
  cookieHeader: string | null | undefined,
  source: Record<string, string | undefined> | NodeJS.ProcessEnv = process.env,
): Promise<ManagedAuthSessionContext | null> {
  const runtime = getManagedAuthRuntime(source);

  if (!runtime.enabled) {
    return null;
  }

  const cookies = parseCookieHeader(cookieHeader);

  for (const cookieName of [
    runtime.config.sessionCookie.name,
    ...SESSION_COOKIE_NAMES,
  ]) {
    const token = cookies.get(cookieName);

    if (!token) {
      continue;
    }

    const payload = verifySessionPayload(token, source);

    if (!payload) {
      continue;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
    });

    if (!user || user.managedAuthSubject !== payload.sub || user.status !== "ACTIVE") {
      return null;
    }

    return buildSessionContext({
      user,
      sessionId: payload.sid,
      providerSessionId: payload.sub,
      issuedAt: new Date(payload.iat * 1000),
      expiresAt: new Date(payload.exp * 1000),
    });
  }

  return null;
}

async function upsertUserFromManagedIdentity(
  identity: ManagedAuthProviderIdentity,
  allowLocalEmailLinking: boolean,
) {
  const existingBySubject = await prisma.user.findUnique({
    where: {
      managedAuthSubject: identity.subject,
    },
  });

  if (existingBySubject?.status === "DISABLED") {
    throw new ManagedAuthSessionError(
      "account_disabled",
      "Managed auth identity belongs to a disabled CoriTech user.",
    );
  }

  if (existingBySubject) {
    const mappedUser = mapManagedAuthIdentityToInternalUser({
      identity,
      existingUser: toManagedAuthMappedUser(existingBySubject),
    });

    return prisma.user.update({
      where: {
        id: existingBySubject.id,
      },
      data: {
        email: mappedUser.email,
        displayName: mappedUser.displayName,
      },
    });
  }

  const existingByEmail = await prisma.user.findUnique({
    where: {
      email: identity.email,
    },
  });

  if (existingByEmail) {
    if (existingByEmail.status === "DISABLED") {
      throw new ManagedAuthSessionError(
        "account_disabled",
        "Managed auth identity belongs to a disabled CoriTech user.",
      );
    }

    if (
      allowLocalEmailLinking ||
      isInvitationPlaceholderSubject(existingByEmail.managedAuthSubject)
    ) {
      const mappedUser = mapManagedAuthIdentityToInternalUser({
        identity,
        userId: existingByEmail.id,
      });

      return prisma.user.update({
        where: {
          id: existingByEmail.id,
        },
        data: {
          managedAuthSubject: mappedUser.managedAuthSubject,
          email: mappedUser.email,
          displayName: mappedUser.displayName,
        },
      });
    }

    throw new ManagedAuthSessionError(
      "account_not_linked",
      "A CoriTech user already exists with this email but a different managed auth subject.",
    );
  }

  const mappedUser = mapManagedAuthIdentityToInternalUser({
    identity,
  });

  return prisma.user.create({
    data: {
      managedAuthSubject: mappedUser.managedAuthSubject,
      email: mappedUser.email,
      displayName: mappedUser.displayName,
      status: mappedUser.status,
    },
  });
}

async function buildSessionContext(input: {
  user: {
    id: string;
    managedAuthSubject: string;
    email: string;
    displayName: string;
    status: "ACTIVE" | "DISABLED";
  };
  sessionId: string;
  providerSessionId: string;
  issuedAt: Date;
  expiresAt: Date;
}) {
  const roleAssignments = await prisma.userOrganizationRole.findMany({
    where: {
      userId: input.user.id,
      revokedAt: null,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  const organizationIds = [...new Set(roleAssignments.map((assignment) =>
    assignment.organizationId
  ))];
  const organizations = organizationIds.length > 0
    ? await prisma.organization.findMany({
      where: {
        id: {
          in: organizationIds,
        },
        status: "ACTIVE",
      },
    })
    : [];
  const organizationNames = new Map(organizations.map((organization) => [
    organization.id,
    organization.name,
  ]));

  return prepareManagedAuthSession({
    sessionId: input.sessionId,
    providerSessionId: input.providerSessionId,
    user: {
      id: input.user.id,
      managedAuthSubject: input.user.managedAuthSubject,
      email: input.user.email,
      displayName: input.user.displayName,
      status: input.user.status,
    },
    roleAssignments: roleAssignments
      .filter((assignment) => organizationNames.has(assignment.organizationId))
      .map((assignment) => ({
        userId: assignment.userId,
        organizationId: assignment.organizationId,
        organizationName: organizationNames.get(assignment.organizationId),
        roleCode: assignment.roleCode,
        revokedAt: assignment.revokedAt?.toISOString() ?? null,
      })),
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
  });
}

function signSessionPayload(
  payload: SessionCookiePayload,
  source: Record<string, string | undefined> | NodeJS.ProcessEnv,
) {
  const encodedPayload = Buffer
    .from(JSON.stringify(payload), "utf8")
    .toString("base64url");
  const signature = createHmac("sha256", getSessionSigningSecret(source))
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function verifySessionPayload(
  token: string,
  source: Record<string, string | undefined> | NodeJS.ProcessEnv,
): SessionCookiePayload | null {
  const [encodedPayload, signature, extra] = token.split(".");

  if (!encodedPayload || !signature || extra !== undefined) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getSessionSigningSecret(source))
    .update(encodedPayload)
    .digest("base64url");

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  let payload: SessionCookiePayload;

  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!isSessionPayload(payload)) {
    return null;
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

function getSessionSigningSecret(
  source: Record<string, string | undefined> | NodeJS.ProcessEnv,
) {
  const secret = normalizeString(source.AUTH_SESSION_SECRET) ||
    normalizeString(source.AUTH_PROVIDER_CLIENT_SECRET);

  if (!secret || looksLikePlaceholder(secret)) {
    throw new ManagedAuthSessionError(
      "session_secret_missing",
      "A non-placeholder auth session signing secret is required.",
    );
  }

  return secret;
}

function isSessionPayload(value: unknown): value is SessionCookiePayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<SessionCookiePayload>;
  const issuedAt = payload.iat;
  const expiresAt = payload.exp;

  return payload.v === SESSION_PAYLOAD_VERSION &&
    typeof payload.sid === "string" &&
    payload.sid.trim() !== "" &&
    typeof payload.userId === "string" &&
    payload.userId.trim() !== "" &&
    typeof payload.sub === "string" &&
    payload.sub.trim() !== "" &&
    typeof issuedAt === "number" &&
    Number.isInteger(issuedAt) &&
    typeof expiresAt === "number" &&
    Number.isInteger(expiresAt) &&
    expiresAt > issuedAt;
}

function parseCookieHeader(cookieHeader: string | null | undefined) {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    const name = rawName?.trim();

    if (!name) {
      continue;
    }

    cookies.set(name, rawValue.join("="));
  }

  return cookies;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer);
}

function toManagedAuthMappedUser(user: {
  id: string;
  managedAuthSubject: string;
  email: string;
  displayName: string;
  status: "ACTIVE" | "DISABLED";
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    managedAuthSubject: user.managedAuthSubject,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function isInvitationPlaceholderSubject(value: unknown) {
  return typeof value === "string" && value.startsWith("invitation|");
}

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function looksLikePlaceholder(value: string) {
  return PLACEHOLDER_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}
