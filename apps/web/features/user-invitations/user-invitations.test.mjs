import assert from "node:assert/strict";
import test from "node:test";

import {
  canManageUserInvitations,
  createInvitationAcceptViewModel,
  createUserInvitationAdminViewModel,
  formatInvitationLabel,
  normalizeInvitationFilters,
} from "./user-invitations.mjs";

const timestamp = "2026-06-10T14:00:00.000Z";
const adminActor = Object.freeze({
  userId: "user-admin",
  organizationId: "org-platform",
  organizationName: "CoriTech Platform",
  roleCode: "PLATFORM_ADMIN",
  roles: Object.freeze([
    Object.freeze({
      userId: "user-admin",
      organizationId: "org-platform",
      roleCode: "PLATFORM_ADMIN",
      revokedAt: null,
    }),
  ]),
});
const breederActor = Object.freeze({
  userId: "user-breeder",
  organizationId: "org-breeder",
  organizationName: "Blue Stud",
  roleCode: "BREEDER",
  roles: Object.freeze([
    Object.freeze({
      userId: "user-breeder",
      organizationId: "org-breeder",
      roleCode: "BREEDER",
      revokedAt: null,
    }),
  ]),
});

test("invitation admin view model exposes invite form options and queued rows", () => {
  const viewModel = createUserInvitationAdminViewModel({
    actor: adminActor,
    createdInvitationLink: "https://app.test/accept-invite?token=abc",
    filters: {
      status: "PENDING",
      email: "breeder",
      organizationId: "org-breeder",
    },
    organizations: [
      {
        id: "org-breeder",
        name: "Blue Stud",
        organizationType: "BREEDER",
        status: "ACTIVE",
      },
      {
        id: "org-station",
        name: "Highveld Station",
        organizationType: "BREEDING_STATION",
        status: "ACTIVE",
      },
    ],
    invitations: [
      invitationFixture({
        email: "breeder@example.com",
        organizationName: "Blue Stud",
        roleCode: "BREEDER",
      }),
    ],
  });

  assert.equal(viewModel.canCreate, true);
  assert.deepEqual(viewModel.roleOptions, ["BREEDER", "BREEDING_STATION"]);
  assert.equal(viewModel.organizationOptions[0].label, "Blue Stud (Breeder)");
  assert.equal(viewModel.rows.length, 1);
  assert.equal(viewModel.rows[0].emailDeliveryStatus, "QUEUED");
  assert.equal(viewModel.createdInvitationLink, "https://app.test/accept-invite?token=abc");
  assert.match(viewModel.emailDeliveryNote, /queued/i);
});

test("invitation view model blocks non-admin actors and normalizes filters", () => {
  assert.equal(canManageUserInvitations(adminActor), true);
  assert.equal(canManageUserInvitations(breederActor), false);
  assert.deepEqual(
    normalizeInvitationFilters({
      status: " PENDING ",
      email: " breeder@example.com ",
      organizationId: " org-breeder ",
    }),
    {
      status: "PENDING",
      email: "breeder@example.com",
      organizationId: "org-breeder",
    },
  );
});

test("accept invite view model separates valid and invalid states", () => {
  const valid = createInvitationAcceptViewModel({
    token: "token-1",
    validation: {
      state: "VALID",
      message: "Invitation is ready to accept.",
      invitation: invitationFixture({
        organizationName: "Highveld Station",
        roleCode: "BREEDING_STATION",
      }),
    },
  });
  const expired = createInvitationAcceptViewModel({
    token: "token-2",
    validation: {
      state: "EXPIRED",
      message: "This invitation has expired.",
      invitation: null,
    },
  });

  assert.equal(valid.canAccept, true);
  assert.equal(valid.invitation?.roleLabel, "Breeding Station");
  assert.equal(valid.landingHref, "/station-dashboard");
  assert.equal(expired.canAccept, false);
  assert.equal(expired.message, "This invitation has expired.");
  assert.equal(expired.invitation, null);
});

test("invitation labels are human readable", () => {
  assert.equal(formatInvitationLabel("BREEDING_STATION"), "Breeding Station");
});

function invitationFixture(overrides = {}) {
  return Object.freeze({
    id: "invitation-1",
    email: "invitee@example.com",
    organizationId: "org-breeder",
    organizationName: "Blue Stud",
    roleCode: "BREEDER",
    status: "PENDING",
    tokenHash: "hash",
    expiresAt: "2026-06-17T14:00:00.000Z",
    invitedByUserId: "user-admin",
    invitedByOrganizationId: "org-platform",
    acceptedAt: null,
    acceptedUserId: null,
    acceptedRoleAssignmentId: null,
    revokedAt: null,
    revokedByUserId: null,
    revocationReason: null,
    emailDeliveryStatus: "QUEUED",
    emailQueuedAt: timestamp,
    emailSentAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  });
}
