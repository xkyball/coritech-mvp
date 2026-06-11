// @ts-check

import {
  USER_INVITATION_STATUSES,
  USER_INVITATION_ROLE_CODES,
  USER_INVITATION_ROUTES,
  acceptUserInvitation,
  canCreateUserInvitation,
  createUserInvitation,
  validateUserInvitationToken,
} from "@coritech/domain/onboarding/user-invitation.mjs";

export const USER_INVITATION_ADMIN_ROUTES = Object.freeze({
  admin: USER_INVITATION_ROUTES.admin,
  accept: USER_INVITATION_ROUTES.accept,
  login: "/auth/login",
});

/**
 * @param {import("./user-invitations.d.ts").UserInvitationActorContext} actor
 * @returns {boolean}
 */
export function canManageUserInvitations(actor) {
  return canCreateUserInvitation(actor);
}

/**
 * @param {import("./user-invitations.d.ts").UserInvitationAdminViewModelInput} input
 * @returns {import("./user-invitations.d.ts").UserInvitationAdminViewModel}
 */
export function createUserInvitationAdminViewModel(input) {
  return Object.freeze({
    state: "READY",
    routes: USER_INVITATION_ADMIN_ROUTES,
    canCreate: canManageUserInvitations(input.actor),
    roleOptions: USER_INVITATION_ROLE_CODES,
    organizationOptions: Object.freeze((input.organizations ?? []).map((organization) =>
      Object.freeze({
        id: organization.id,
        name: organization.name,
        organizationType: organization.organizationType,
        label: `${organization.name} (${formatInvitationLabel(organization.organizationType)})`,
      })
    )),
    rows: Object.freeze((input.invitations ?? []).map(toInvitationRow)),
    filters: normalizeInvitationFilters(input.filters ?? {}),
    createdInvitationLink: normalizeOptionalString(input.createdInvitationLink) ?? "",
    emailDeliveryNote:
      "Invitation emails are queued in Phase 1.1; provider delivery is owned by the email-provider ticket.",
  });
}

/**
 * @param {import("./user-invitations.d.ts").InvitationAcceptViewModelInput} input
 * @returns {import("./user-invitations.d.ts").InvitationAcceptViewModel}
 */
export function createInvitationAcceptViewModel(input) {
  const validation = input.validation;

  if (validation.state !== "VALID" || !validation.invitation) {
    return Object.freeze({
      state: validation.state,
      token: normalizeOptionalString(input.token) ?? "",
      message: validation.message,
      invitation: null,
      landingHref: "",
      canAccept: false,
    });
  }

  return Object.freeze({
    state: "VALID",
    token: normalizeOptionalString(input.token) ?? "",
    message: validation.message,
    invitation: Object.freeze({
      email: validation.invitation.email,
      organizationName:
        validation.invitation.organizationName ?? validation.invitation.organizationId,
      roleLabel: formatInvitationLabel(validation.invitation.roleCode),
      expiresAt: validation.invitation.expiresAt,
    }),
    landingHref: validation.invitation.roleCode === "BREEDING_STATION"
      ? "/station-dashboard"
      : "/breeder-dashboard",
    canAccept: true,
  });
}

/**
 * @param {import("./user-invitations.d.ts").CreateManagedUserInvitationInput} input
 */
export async function createManagedUserInvitation(input) {
  return createUserInvitation({
    actor: input.actor,
    repository: input.repository,
    email: input.email,
    organizationId: input.organizationId,
    roleCode: input.roleCode,
    inviteBaseUrl: input.inviteBaseUrl,
    expiresInDays: input.expiresInDays,
    now: input.now,
  });
}

/**
 * @param {import("./user-invitations.d.ts").AcceptManagedUserInvitationInput} input
 */
export async function acceptManagedUserInvitation(input) {
  return acceptUserInvitation({
    repository: input.repository,
    token: input.token,
    displayName: input.displayName,
    auditContext: input.auditContext,
    now: input.now,
  });
}

/**
 * @param {import("./user-invitations.d.ts").ValidateManagedUserInvitationInput} input
 */
export async function validateManagedUserInvitation(input) {
  return validateUserInvitationToken({
    repository: input.repository,
    token: input.token,
    now: input.now,
  });
}

/**
 * @param {Record<string, unknown>} input
 * @returns {import("./user-invitations.d.ts").UserInvitationFilters}
 */
export function normalizeInvitationFilters(input) {
  return Object.freeze({
    status: normalizeAllowedOption(input.status, USER_INVITATION_STATUSES),
    email: normalizeOptionalString(input.email) ?? "",
    organizationId: normalizeOptionalString(input.organizationId) ?? "",
  });
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatInvitationLabel(value) {
  return String(value ?? "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * @param {import("@coritech/domain/onboarding/user-invitation.d.ts").UserInvitation} invitation
 * @returns {import("./user-invitations.d.ts").UserInvitationRow}
 */
function toInvitationRow(invitation) {
  return Object.freeze({
    id: invitation.id,
    email: invitation.email,
    organizationLabel: invitation.organizationName ?? invitation.organizationId,
    roleLabel: formatInvitationLabel(invitation.roleCode),
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt ?? "Not accepted",
    emailDeliveryStatus: invitation.emailDeliveryStatus,
    emailQueuedAt: invitation.emailQueuedAt ?? "Not queued",
  });
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
 * @template {string} T
 * @param {unknown} value
 * @param {readonly T[]} options
 * @returns {T | ""}
 */
function normalizeAllowedOption(value, options) {
  const normalized = normalizeOptionalString(value);

  return normalized && options.includes(/** @type {T} */ (normalized))
    ? /** @type {T} */ (normalized)
    : "";
}
