// @ts-check

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { createAuditLogFromHook } from "../audit/audit-log.mjs";
import {
  assignUserOrganizationRole,
  buildRoleAssignmentAuditHook,
  isActiveRoleAssignment,
} from "../identity/role-model.mjs";

export const USER_INVITATION_STATUSES = /** @type {const} */ ([
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "REVOKED",
]);

export const USER_INVITATION_EMAIL_STATUSES = /** @type {const} */ ([
  "QUEUED",
  "SENT",
  "FAILED",
]);

export const USER_INVITATION_ROLE_CODES = /** @type {const} */ ([
  "BREEDER",
  "BREEDING_STATION",
]);

export const USER_INVITATION_ROUTES = Object.freeze({
  admin: "/app/admin/invitations",
  accept: "/accept-invite",
});

export const USER_INVITATION_TOKEN_POLICY = Object.freeze({
  tokenBytes: 32,
  minimumTokenLength: 43,
  defaultExpiryDays: 7,
  storedAsHash: true,
  roleGrantedOnAcceptanceOnly: true,
  emailDeliveryStatus: "QUEUED",
});

export class UserInvitationValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech invitation input:\n- ${issues.join("\n- ")}`);
    this.name = "UserInvitationValidationError";
    this.issues = issues;
  }
}

export class UserInvitationAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "UserInvitationAuthorizationError";
  }
}

export class UserInvitationStateError extends Error {
  /**
   * @param {import("./user-invitation.d.ts").InvitationValidationState} state
   * @param {string} message
   */
  constructor(state, message) {
    super(message);
    this.name = "UserInvitationStateError";
    this.state = state;
  }
}

/**
 * @param {import("./user-invitation.d.ts").UserInvitationActorContext} actor
 * @returns {boolean}
 */
export function canCreateUserInvitation(actor) {
  return Boolean(findPlatformAdminRole(actor));
}

/**
 * @param {unknown} value
 * @returns {value is import("./user-invitation.d.ts").UserInvitationStatus}
 */
export function isUserInvitationStatus(value) {
  return typeof value === "string" && USER_INVITATION_STATUSES.includes(
    /** @type {import("./user-invitation.d.ts").UserInvitationStatus} */ (value),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./user-invitation.d.ts").UserInvitationRoleCode}
 */
export function isUserInvitationRoleCode(value) {
  return typeof value === "string" && USER_INVITATION_ROLE_CODES.includes(
    /** @type {import("./user-invitation.d.ts").UserInvitationRoleCode} */ (value),
  );
}

/**
 * @returns {string}
 */
export function generateInvitationToken() {
  return randomBytes(USER_INVITATION_TOKEN_POLICY.tokenBytes).toString("base64url");
}

/**
 * @param {string} token
 * @returns {string}
 */
export function hashInvitationToken(token) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * @param {string} left
 * @param {string} right
 * @returns {boolean}
 */
export function safeInvitationTokenHashEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer);
}

/**
 * @param {import("./user-invitation.d.ts").CreateUserInvitationInput} input
 */
export async function createUserInvitation(input) {
  assertCanCreateInvitation(input.actor);

  const adminRole = findPlatformAdminRole(input.actor);
  const now = toIsoTimestamp(input.now ?? new Date());
  const email = requireEmail(input.email);
  const organizationId = requireNonBlankString(input.organizationId, "Organization");
  const roleCode = normalizeInvitationRole(input.roleCode);
  const organization = await input.repository.getOrganizationById(organizationId);

  if (!roleCode) {
    throw new UserInvitationValidationError([
      "roleCode must be BREEDER or BREEDING_STATION for Phase 1 onboarding.",
    ]);
  }

  if (!organization || organization.status !== "ACTIVE") {
    throw new UserInvitationValidationError(["Select an active organization."]);
  }

  validateOrganizationRolePair(organization, roleCode);

  const token = input.tokenFactory?.() ?? generateInvitationToken();
  validateInvitationTokenShape(token);

  const expiresAt = normalizeExpiry(input.expiresAt, input.expiresInDays, now);
  const invitation = await input.repository.createInvitation({
    id: null,
    email,
    organizationId,
    organizationName: organization.name,
    roleCode,
    status: "PENDING",
    tokenHash: hashInvitationToken(token),
    expiresAt,
    invitedByUserId: input.actor.userId,
    invitedByOrganizationId: adminRole?.organizationId ?? input.actor.organizationId,
    acceptedAt: null,
    acceptedUserId: null,
    acceptedRoleAssignmentId: null,
    revokedAt: null,
    revokedByUserId: null,
    revocationReason: null,
    emailDeliveryStatus: "QUEUED",
    emailQueuedAt: now,
    emailSentAt: null,
    createdAt: now,
    updatedAt: now,
  });
  const invitationLink = buildInvitationLink(input.inviteBaseUrl, token);

  await input.repository.queueInvitationEmail?.({
    invitation,
    invitationLink,
    queuedAt: now,
  });

  return Object.freeze({
    invitation,
    inviteToken: token,
    invitationLink,
    emailDelivery: Object.freeze({
      status: invitation.emailDeliveryStatus,
      queuedAt: invitation.emailQueuedAt,
    }),
  });
}

/**
 * @param {import("./user-invitation.d.ts").ValidateUserInvitationTokenInput} input
 * @returns {Promise<import("./user-invitation.d.ts").InvitationValidationResult>}
 */
export async function validateUserInvitationToken(input) {
  const token = normalizeOptionalString(input.token);

  if (!token) {
    return invalidInvitation("INVALID", "Invitation token is missing.");
  }

  const invitation = await input.repository.findInvitationByTokenHash(
    hashInvitationToken(token),
  );

  return evaluateInvitation(invitation, input.now ?? new Date());
}

/**
 * @param {import("./user-invitation.d.ts").AcceptUserInvitationInput} input
 */
export async function acceptUserInvitation(input) {
  const token = requireNonBlankString(input.token, "Invitation token");
  const displayName = requireNonBlankString(input.displayName, "Display name");
  const tokenHash = hashInvitationToken(token);
  const invitation = await input.repository.findInvitationByTokenHash(tokenHash);
  const validation = evaluateInvitation(invitation, input.now ?? new Date());

  if (validation.state !== "VALID") {
    if (validation.state === "EXPIRED" && validation.invitation) {
      await input.repository.updateInvitation({
        ...validation.invitation,
        status: "EXPIRED",
        updatedAt: toIsoTimestamp(input.now ?? new Date()),
      });
    }

    throw new UserInvitationStateError(validation.state, validation.message);
  }

  const pendingInvitation = validation.invitation;
  const existingUser = await input.repository.findUserByEmail(pendingInvitation.email);

  if (existingUser?.status === "DISABLED") {
    throw new UserInvitationStateError(
      "INVALID",
      "This invitation cannot be accepted for a disabled user.",
    );
  }

  const user = existingUser
    ? await input.repository.updateUserProfile({
      ...existingUser,
      displayName,
      status: "ACTIVE",
    })
    : await input.repository.createUser({
      id: null,
      managedAuthSubject: `invitation|${pendingInvitation.id ?? tokenHash}`,
      email: pendingInvitation.email,
      displayName,
      status: "ACTIVE",
      createdAt: toIsoTimestamp(input.now ?? new Date()),
      updatedAt: toIsoTimestamp(input.now ?? new Date()),
    });
  const prepared = assignUserOrganizationRole({
    userId: user.id,
    organizationId: pendingInvitation.organizationId,
    roleCode: pendingInvitation.roleCode,
    assignedByUserId: pendingInvitation.invitedByUserId,
    assignerRoles: [
      {
        userId: pendingInvitation.invitedByUserId,
        organizationId: pendingInvitation.invitedByOrganizationId,
        roleCode: "PLATFORM_ADMIN",
        revokedAt: null,
      },
    ],
    assignmentReason: `Accepted invitation for ${pendingInvitation.email}.`,
    now: input.now,
  });
  const assignment = await input.repository.createUserOrganizationRole(
    prepared.assignment,
  );
  const auditHook = buildRoleAssignmentAuditHook({
    assignment,
    actorOrganizationId: pendingInvitation.invitedByOrganizationId,
  });
  const auditLog = await createAuditLogFromHook({
    repository: input.repository,
    auditHook,
    requestContext: input.auditContext,
  });
  const acceptedAt = toIsoTimestamp(input.now ?? new Date());
  const acceptedInvitation = await input.repository.updateInvitation({
    ...pendingInvitation,
    status: "ACCEPTED",
    acceptedAt,
    acceptedUserId: user.id,
    acceptedRoleAssignmentId: assignment.id,
    updatedAt: acceptedAt,
  });

  return Object.freeze({
    invitation: acceptedInvitation,
    user,
    assignment,
    auditHook,
    auditLog,
    landingHref: getInvitationLandingHref(pendingInvitation.roleCode),
  });
}

/**
 * @param {import("./user-invitation.d.ts").UserInvitationRoleCode} roleCode
 * @returns {string}
 */
export function getInvitationLandingHref(roleCode) {
  return roleCode === "BREEDING_STATION"
    ? "/station-dashboard"
    : "/breeder-dashboard";
}

/**
 * @param {string | null | undefined} baseUrl
 * @param {string} token
 * @returns {string}
 */
export function buildInvitationLink(baseUrl, token) {
  const normalizedBaseUrl = normalizeOptionalString(baseUrl) ?? USER_INVITATION_ROUTES.accept;
  const url = normalizedBaseUrl.startsWith("http")
    ? new URL(normalizedBaseUrl)
    : new URL(normalizedBaseUrl, "http://coritech.local");

  url.searchParams.set("token", token);

  return normalizedBaseUrl.startsWith("http")
    ? url.toString()
    : `${url.pathname}?${url.searchParams.toString()}`;
}

/**
 * @param {import("./user-invitation.d.ts").UserInvitationActorContext} actor
 */
function assertCanCreateInvitation(actor) {
  if (!canCreateUserInvitation(actor)) {
    throw new UserInvitationAuthorizationError(
      "Only active Platform Admin users can create invitations.",
    );
  }
}

/**
 * @param {import("./user-invitation.d.ts").UserInvitation | null | undefined} invitation
 * @param {string | Date} now
 * @returns {import("./user-invitation.d.ts").InvitationValidationResult}
 */
function evaluateInvitation(invitation, now) {
  if (!invitation) {
    return invalidInvitation("INVALID", "Invitation token is invalid.");
  }

  if (invitation.status === "ACCEPTED") {
    return invalidInvitation("USED", "This invitation has already been accepted.", invitation);
  }

  if (invitation.status === "REVOKED") {
    return invalidInvitation("REVOKED", "This invitation has been revoked.", invitation);
  }

  if (invitation.status === "EXPIRED" || new Date(invitation.expiresAt) <= new Date(now)) {
    return invalidInvitation("EXPIRED", "This invitation has expired.", invitation);
  }

  if (invitation.status !== "PENDING") {
    return invalidInvitation("INVALID", "Invitation is not available for acceptance.", invitation);
  }

  return Object.freeze({
    state: "VALID",
    message: "Invitation is ready to accept.",
    invitation,
  });
}

/**
 * @param {import("./user-invitation.d.ts").InvitationValidationState} state
 * @param {string} message
 * @param {import("./user-invitation.d.ts").UserInvitation | null} [invitation]
 * @returns {import("./user-invitation.d.ts").InvitationValidationResult}
 */
function invalidInvitation(state, message, invitation = null) {
  return Object.freeze({
    state,
    message,
    invitation,
  });
}

/**
 * @param {string} token
 */
function validateInvitationTokenShape(token) {
  if (
    typeof token !== "string" ||
    token.length < USER_INVITATION_TOKEN_POLICY.minimumTokenLength
  ) {
    throw new UserInvitationValidationError([
      "Invitation token must be generated from at least 32 random bytes.",
    ]);
  }
}

/**
 * @param {import("./user-invitation.d.ts").InvitationOrganization} organization
 * @param {import("./user-invitation.d.ts").UserInvitationRoleCode} roleCode
 */
function validateOrganizationRolePair(organization, roleCode) {
  const expectedOrganizationType = roleCode === "BREEDING_STATION"
    ? "BREEDING_STATION"
    : "BREEDER";

  if (organization.organizationType !== expectedOrganizationType) {
    throw new UserInvitationValidationError([
      `${roleCode} invitations must target an active ${expectedOrganizationType} organization.`,
    ]);
  }
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function requireEmail(value) {
  const email = normalizeOptionalString(value)?.toLowerCase();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new UserInvitationValidationError(["Enter a valid invitation email."]);
  }

  return email;
}

/**
 * @param {unknown} value
 * @returns {import("./user-invitation.d.ts").UserInvitationRoleCode | ""}
 */
function normalizeInvitationRole(value) {
  return isUserInvitationRoleCode(value)
    ? /** @type {import("./user-invitation.d.ts").UserInvitationRoleCode} */ (value)
    : "";
}

/**
 * @param {unknown} value
 * @param {string} label
 * @returns {string}
 */
function requireNonBlankString(value, label) {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    throw new UserInvitationValidationError([`${label} is required.`]);
  }

  return normalized;
}

/**
 * @param {unknown} value
 * @param {unknown} expiresInDays
 * @param {string} now
 * @returns {string}
 */
function normalizeExpiry(value, expiresInDays, now) {
  const explicitExpiry = value ? new Date(/** @type {string | Date} */ (value)) : null;
  const parsedDays = Number(expiresInDays);
  const days = Number.isInteger(parsedDays) && parsedDays > 0 && parsedDays <= 30
    ? parsedDays
    : USER_INVITATION_TOKEN_POLICY.defaultExpiryDays;
  const expiry = explicitExpiry && !Number.isNaN(explicitExpiry.getTime())
    ? explicitExpiry
    : new Date(new Date(now).getTime() + days * 24 * 60 * 60 * 1000);

  if (expiry <= new Date(now)) {
    throw new UserInvitationValidationError(["Invitation expiry must be in the future."]);
  }

  return expiry.toISOString();
}

/**
 * @param {import("./user-invitation.d.ts").UserInvitationActorContext | null | undefined} actor
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findPlatformAdminRole(actor) {
  if (!actor || !Array.isArray(actor.roles)) {
    return undefined;
  }

  return actor.roles.find((assignment) =>
    assignment.userId === actor.userId &&
    assignment.roleCode === "PLATFORM_ADMIN" &&
    isActiveRoleAssignment(assignment)
  );
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * @param {string | Date} value
 * @returns {string}
 */
function toIsoTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new UserInvitationValidationError(["Timestamp must be a valid date."]);
  }

  return date.toISOString();
}
