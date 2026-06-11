import assert from "node:assert/strict";
import test from "node:test";

import {
  USER_INVITATION_ROLE_CODES,
  USER_INVITATION_STATUSES,
  USER_INVITATION_TOKEN_POLICY,
  UserInvitationAuthorizationError,
  UserInvitationStateError,
  UserInvitationValidationError,
  acceptUserInvitation,
  canCreateUserInvitation,
  createUserInvitation,
  hashInvitationToken,
  validateUserInvitationToken,
} from "./user-invitation.mjs";

const timestamp = "2026-06-10T14:00:00.000Z";
const futureExpiry = "2026-06-17T14:00:00.000Z";
const expiredAt = "2026-06-09T14:00:00.000Z";
const inviteToken = "invite-token-value-with-32-random-bytes-minimum";
const platformOrganizationId = "org-platform";
const breederOrganizationId = "org-breeder-a";
const stationOrganizationId = "org-station-a";

const adminActor = Object.freeze({
  userId: "user-admin",
  organizationId: platformOrganizationId,
  organizationName: "CoriTech Platform",
  roleCode: "PLATFORM_ADMIN",
  roles: Object.freeze([
    Object.freeze({
      userId: "user-admin",
      organizationId: platformOrganizationId,
      roleCode: "PLATFORM_ADMIN",
      revokedAt: null,
    }),
  ]),
});

const breederActor = Object.freeze({
  userId: "user-breeder",
  organizationId: breederOrganizationId,
  organizationName: "Blue Stud",
  roleCode: "BREEDER",
  roles: Object.freeze([
    Object.freeze({
      userId: "user-breeder",
      organizationId: breederOrganizationId,
      roleCode: "BREEDER",
      revokedAt: null,
    }),
  ]),
});

test("invitation contract exposes pending lifecycle and inviteable Phase 1 roles", () => {
  assert.deepEqual(USER_INVITATION_STATUSES, [
    "PENDING",
    "ACCEPTED",
    "EXPIRED",
    "REVOKED",
  ]);
  assert.deepEqual(USER_INVITATION_ROLE_CODES, [
    "BREEDER",
    "BREEDING_STATION",
  ]);
  assert.equal(USER_INVITATION_TOKEN_POLICY.storedAsHash, true);
  assert.equal(USER_INVITATION_TOKEN_POLICY.roleGrantedOnAcceptanceOnly, true);
  assert.equal(canCreateUserInvitation(adminActor), true);
  assert.equal(canCreateUserInvitation(breederActor), false);
});

test("platform admin can create queued invitation without granting a role", async () => {
  const repository = buildRepository();
  const result = await createUserInvitation({
    actor: adminActor,
    repository,
    email: "New.Breeder@Example.com",
    organizationId: breederOrganizationId,
    roleCode: "BREEDER",
    inviteBaseUrl: "https://app.coritech.test/accept-invite",
    expiresAt: futureExpiry,
    tokenFactory: () => inviteToken,
    now: timestamp,
  });

  assert.equal(result.invitation.email, "new.breeder@example.com");
  assert.equal(result.invitation.status, "PENDING");
  assert.equal(result.invitation.emailDeliveryStatus, "QUEUED");
  assert.equal(result.invitation.expiresAt, futureExpiry);
  assert.equal(result.invitation.tokenHash, hashInvitationToken(inviteToken));
  assert.notEqual(result.invitation.tokenHash, inviteToken);
  assert.match(result.invitationLink, /^https:\/\/app\.coritech\.test\/accept-invite\?token=/);
  assert.equal(repository.assignments.length, 0);
  assert.equal(repository.emailQueue.length, 1);
});

test("valid invitation acceptance creates user, role assignment and audit log", async () => {
  const repository = buildRepository();
  await createUserInvitation({
    actor: adminActor,
    repository,
    email: "breeder@example.com",
    organizationId: breederOrganizationId,
    roleCode: "BREEDER",
    expiresAt: futureExpiry,
    tokenFactory: () => inviteToken,
    now: timestamp,
  });
  const accepted = await acceptUserInvitation({
    repository,
    token: inviteToken,
    displayName: "Ava Breeder",
    auditContext: {
      userAgent: "node-test/user-invitation",
    },
    now: "2026-06-10T14:05:00.000Z",
  });

  assert.equal(accepted.invitation.status, "ACCEPTED");
  assert.equal(accepted.invitation.acceptedUserId, "user-1");
  assert.equal(accepted.user.email, "breeder@example.com");
  assert.equal(accepted.user.displayName, "Ava Breeder");
  assert.equal(accepted.user.managedAuthSubject, "invitation|invitation-1");
  assert.equal(accepted.assignment.userId, "user-1");
  assert.equal(accepted.assignment.organizationId, breederOrganizationId);
  assert.equal(accepted.assignment.roleCode, "BREEDER");
  assert.equal(accepted.auditLog.action, "CHANGE_PERMISSION");
  assert.equal(accepted.auditLog.sourceAction, "ROLE_ASSIGNED");
  assert.equal(accepted.auditLog.objectType, "UserOrganizationRole");
  assert.equal(accepted.auditLog.userAgent, "node-test/user-invitation");
  assert.equal(accepted.landingHref, "/breeder-dashboard");
});

test("invitation acceptance can link an existing active user", async () => {
  const repository = buildRepository({
    users: [
      {
        id: "user-existing",
        managedAuthSubject: "google-oauth2|existing",
        email: "station@example.com",
        displayName: "Old Station Name",
        status: "ACTIVE",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
  });
  await createUserInvitation({
    actor: adminActor,
    repository,
    email: "station@example.com",
    organizationId: stationOrganizationId,
    roleCode: "BREEDING_STATION",
    expiresAt: futureExpiry,
    tokenFactory: () => inviteToken,
    now: timestamp,
  });
  const accepted = await acceptUserInvitation({
    repository,
    token: inviteToken,
    displayName: "Highveld Operator",
    now: "2026-06-10T14:05:00.000Z",
  });

  assert.equal(accepted.user.id, "user-existing");
  assert.equal(accepted.user.displayName, "Highveld Operator");
  assert.equal(accepted.assignment.roleCode, "BREEDING_STATION");
  assert.equal(accepted.landingHref, "/station-dashboard");
});

test("invalid and expired invitations are rejected clearly", async () => {
  const repository = buildRepository();
  const invalid = await validateUserInvitationToken({
    repository,
    token: "missing-token",
    now: timestamp,
  });

  assert.equal(invalid.state, "INVALID");

  await createUserInvitation({
    actor: adminActor,
    repository,
    email: "expired@example.com",
    organizationId: breederOrganizationId,
    roleCode: "BREEDER",
    expiresAt: expiredAt,
    tokenFactory: () => inviteToken,
    now: "2026-06-08T14:00:00.000Z",
  });

  const expired = await validateUserInvitationToken({
    repository,
    token: inviteToken,
    now: timestamp,
  });

  assert.equal(expired.state, "EXPIRED");

  await assert.rejects(
    () =>
      acceptUserInvitation({
        repository,
        token: inviteToken,
        displayName: "Expired Invitee",
        now: timestamp,
      }),
    (error) =>
      error instanceof UserInvitationStateError &&
      error.state === "EXPIRED",
  );
  assert.equal(repository.invitations[0].status, "EXPIRED");
});

test("invitation creation is admin-only and cannot self-register privileged roles", async () => {
  await assert.rejects(
    () =>
      createUserInvitation({
        actor: breederActor,
        repository: buildRepository(),
        email: "new@example.com",
        organizationId: breederOrganizationId,
        roleCode: "BREEDER",
        tokenFactory: () => inviteToken,
        now: timestamp,
      }),
    UserInvitationAuthorizationError,
  );

  await assert.rejects(
    () =>
      createUserInvitation({
        actor: adminActor,
        repository: buildRepository(),
        email: "new@example.com",
        organizationId: platformOrganizationId,
        roleCode: "PLATFORM_ADMIN",
        tokenFactory: () => inviteToken,
        now: timestamp,
      }),
    (error) =>
      error instanceof UserInvitationValidationError &&
      error.issues.includes(
        "roleCode must be BREEDER or BREEDING_STATION for Phase 1 onboarding.",
      ),
  );

  await assert.rejects(
    () =>
      createUserInvitation({
        actor: adminActor,
        repository: buildRepository(),
        email: "station@example.com",
        organizationId: breederOrganizationId,
        roleCode: "BREEDING_STATION",
        tokenFactory: () => inviteToken,
        now: timestamp,
      }),
    (error) =>
      error instanceof UserInvitationValidationError &&
      error.issues.includes(
        "BREEDING_STATION invitations must target an active BREEDING_STATION organization.",
      ),
  );
});

function buildRepository(options = {}) {
  const organizations = new Map([
    [
      platformOrganizationId,
      {
        id: platformOrganizationId,
        name: "CoriTech Platform",
        organizationType: "PLATFORM",
        status: "ACTIVE",
      },
    ],
    [
      breederOrganizationId,
      {
        id: breederOrganizationId,
        name: "Blue Stud",
        organizationType: "BREEDER",
        status: "ACTIVE",
      },
    ],
    [
      stationOrganizationId,
      {
        id: stationOrganizationId,
        name: "Highveld Station",
        organizationType: "BREEDING_STATION",
        status: "ACTIVE",
      },
    ],
  ]);
  const repository = {
    invitations: [],
    users: [...(options.users ?? [])],
    assignments: [],
    auditLogs: [],
    emailQueue: [],
    async getOrganizationById(organizationId) {
      return organizations.get(organizationId) ?? null;
    },
    async createInvitation(invitation) {
      const persisted = Object.freeze({
        ...invitation,
        id: invitation.id ?? `invitation-${repository.invitations.length + 1}`,
      });

      repository.invitations.push(persisted);
      return persisted;
    },
    async updateInvitation(invitation) {
      const index = repository.invitations.findIndex((item) => item.id === invitation.id);
      const persisted = Object.freeze({ ...invitation });

      if (index >= 0) {
        repository.invitations[index] = persisted;
      } else {
        repository.invitations.push(persisted);
      }

      return persisted;
    },
    async findInvitationByTokenHash(tokenHash) {
      return repository.invitations.find((invitation) =>
        invitation.tokenHash === tokenHash
      ) ?? null;
    },
    async findUserByEmail(email) {
      return repository.users.find((user) => user.email === email) ?? null;
    },
    async createUser(user) {
      const persisted = Object.freeze({
        ...user,
        id: user.id ?? `user-${repository.users.length + 1}`,
      });

      repository.users.push(persisted);
      return persisted;
    },
    async updateUserProfile(user) {
      const index = repository.users.findIndex((item) => item.id === user.id);
      const persisted = Object.freeze({
        ...user,
        updatedAt: user.updatedAt ?? timestamp,
      });

      if (index >= 0) {
        repository.users[index] = persisted;
      }

      return persisted;
    },
    async createUserOrganizationRole(assignment) {
      const persisted = Object.freeze({
        ...assignment,
        id: assignment.id ?? `assignment-${repository.assignments.length + 1}`,
      });

      repository.assignments.push(persisted);
      return persisted;
    },
    async createAuditLog(auditLog) {
      const persisted = Object.freeze({
        ...auditLog,
        id: auditLog.id ?? `audit-${repository.auditLogs.length + 1}`,
      });

      repository.auditLogs.push(persisted);
      return persisted;
    },
    async queueInvitationEmail(input) {
      repository.emailQueue.push(Object.freeze(input));
    },
  };

  return repository;
}
