// @ts-check

import assert from "node:assert/strict";
import test from "node:test";

import {
  createOrganizationForAdmin,
} from "../apps/web/features/admin-identity/admin-identity-management.mjs";
import {
  acceptManagedUserInvitation,
  createManagedUserInvitation,
} from "../apps/web/features/user-invitations/user-invitations.mjs";
import {
  createSemenListingEndpoint,
  createStallionEndpoint,
} from "../packages/domain/src/catalog/semen-catalog.mjs";
import {
  createDocumentEndpoint,
  getDocumentEndpoint,
} from "../packages/domain/src/documents/document-evidence.mjs";
import { createConsoleEmailProvider } from "../packages/domain/src/notifications/email-provider.mjs";
import { createNotificationOrchestrationService } from "../packages/domain/src/notifications/notification-orchestration.mjs";
import { createOrderService } from "../packages/domain/src/orders/semen-order.mjs";
import { createManualLogisticsAdapter } from "../packages/domain/src/shipments/logistics-provider-adapter.mjs";

const timestamp = "2026-06-10T10:00:00.000Z";
const breederOrganizationId = "e2e-org-breeder";
const stationOrganizationId = "e2e-org-station";
const platformOrganizationId = "e2e-org-platform";
const otherStationActor = actor("e2e-user-other-station", "BREEDING_STATION", "e2e-org-other-station");
const adminActor = actor("e2e-user-admin", "PLATFORM_ADMIN", platformOrganizationId);
const breederEmail = "breeder.e2e@example.test";
const stationEmail = "station.e2e@example.test";

test("complete MVP order journey covers admin setup, catalog, order, shipment, document, proof, audit, notifications and access boundaries", async () => {
  const repository = createE2eRepository();
  const sentEmails = [];
  const notificationService = createNotificationOrchestrationService({
    provider: createConsoleEmailProvider({
      fromAddress: "notifications@coritech.test",
      fromName: "CoriTech",
      sink(message) {
        sentEmails.push(message);
      },
    }),
    logRepository: repository,
    recipientResolver: repository,
  });

  const breederOrganization = await createOrganizationForAdmin({
    actor: adminActor,
    repository,
    name: "E2E Breeder",
    organizationType: "BREEDER",
    reason: "E2E admin creates breeder organization.",
    now: timestamp,
  });
  const stationOrganization = await createOrganizationForAdmin({
    actor: adminActor,
    repository,
    name: "E2E Breeding Station",
    organizationType: "BREEDING_STATION",
    reason: "E2E admin creates station organization.",
    now: timestamp,
  });
  const breederInvitation = await createManagedUserInvitation({
    actor: adminActor,
    repository,
    email: breederEmail,
    organizationId: breederOrganization.organization.id,
    roleCode: "BREEDER",
    inviteBaseUrl: "/accept-invite",
    expiresInDays: 7,
    tokenFactory: () => "e2e-breeder-invite-token-that-is-long-enough-001",
    now: timestamp,
  });
  const stationInvitation = await createManagedUserInvitation({
    actor: adminActor,
    repository,
    email: stationEmail,
    organizationId: stationOrganization.organization.id,
    roleCode: "BREEDING_STATION",
    inviteBaseUrl: "/accept-invite",
    expiresInDays: 7,
    tokenFactory: () => "e2e-station-invite-token-that-is-long-enough-001",
    now: timestamp,
  });
  const acceptedBreeder = await acceptManagedUserInvitation({
    repository,
    token: breederInvitation.inviteToken,
    displayName: "E2E Breeder",
    auditContext: {
      userAgent: "node-test/complete-e2e",
    },
    now: timestamp,
  });
  const acceptedStation = await acceptManagedUserInvitation({
    repository,
    token: stationInvitation.inviteToken,
    displayName: "E2E Station",
    auditContext: {
      userAgent: "node-test/complete-e2e",
    },
    now: timestamp,
  });
  const breederActor = actor(
    acceptedBreeder.user.id,
    "BREEDER",
    acceptedBreeder.assignment.organizationId,
  );
  const stationActor = actor(
    acceptedStation.user.id,
    "BREEDING_STATION",
    acceptedStation.assignment.organizationId,
  );

  const stallion = await createStallionEndpoint({
    actor: stationActor,
    repository,
    body: {
      stallionId: "e2e-stallion-1",
      name: "Copper Vale",
      breed: "KWPN",
      ueln: "UELN-E2E-001",
      microchipNumber: null,
      breedingStationOrganizationId: stationOrganizationId,
      changeReason: "E2E station creates stallion.",
      createdAt: timestamp,
    },
  });
  const listing = await createSemenListingEndpoint({
    actor: stationActor,
    repository,
    body: {
      listingId: "e2e-listing-1",
      stallionId: stallion.body.stallion.id,
      availabilityStatus: "AVAILABLE",
      listingStatus: "ACTIVE",
      termsSummary: "Fresh semen collection by appointment.",
      changeReason: "E2E station publishes listing.",
      createdAt: timestamp,
    },
  });
  const orderService = createOrderService({
    repository,
    auditContext: {
      userAgent: "node-test/complete-e2e",
    },
    notificationService,
  });
  const draft = await orderService.createDraftOrder({
    actor: breederActor,
    body: {
      semenListingId: listing.body.listing.id,
      breederOrganizationId,
      requestedDeliveryDate: "2026-06-12",
      mareName: "Willow Queen",
      mareRegistrationReference: "M-REG-E2E-001",
      mareBreed: "Warmblood",
      mareOwnerName: "Ava Breeder",
      intendedInseminationContext: "Fresh semen insemination at home yard.",
      vetOrRecipientContact: "Dr. Ndlovu, +27 82 555 0102",
      shippingContactName: "Ava Breeder",
      shippingContactPhone: "+27 82 555 0101",
      shippingAddressLine1: "42 Foaling Barn Road",
      shippingAddressLine2: "Gate 3",
      shippingCity: "Pretoria",
      shippingRegion: "Gauteng",
      shippingPostalCode: "0081",
      shippingCountry: "South Africa",
      specialInstructions: "Call before dispatch.",
      reason: "E2E breeder creates draft.",
      createdAt: timestamp,
    },
  });
  const submitted = await orderService.submitOrder({
    actor: breederActor,
    orderId: draft.order.id,
    body: {
      reason: "E2E breeder submits order.",
      now: timestamp,
    },
  });

  await assert.rejects(
    () =>
      orderService.receiveOrder({
        actor: otherStationActor,
        orderId: submitted.order.id,
        body: {
          reason: "Wrong station tries to receive.",
          now: timestamp,
        },
      }),
    /actor is not authorized for this semen order status transition/,
  );

  const received = await orderService.receiveOrder({
    actor: stationActor,
    orderId: submitted.order.id,
    body: {
      reason: "E2E station receives order.",
      now: timestamp,
    },
  });
  const confirmed = await orderService.confirmOrder({
    actor: stationActor,
    orderId: received.order.id,
    body: {
      reason: "E2E station confirms order.",
      now: timestamp,
    },
  });
  const logisticsAdapter = createManualLogisticsAdapter({
    repository,
    providerName: "E2E manual courier",
    notificationService,
  });
  const shipment = await logisticsAdapter.createShipment({
    actor: stationActor,
    orderId: confirmed.order.id,
    body: {
      providerTrackingId: "E2E-TRACK-1",
      trackingUrl: "https://carrier.example/track/E2E-TRACK-1",
      notes: "E2E station creates shipment.",
      now: timestamp,
    },
  });
  const shipmentUpdate = await logisticsAdapter.recordTrackingEvent({
    actor: stationActor,
    shipmentId: shipment.shipment.id,
    event: {
      providerTrackingId: "E2E-TRACK-1",
      providerStatus: "in_transit",
      sourceEventId: "e2e-provider-event-1",
      location: "Johannesburg",
      notes: "E2E shipment in transit.",
      occurredAt: "2026-06-10T11:00:00.000Z",
    },
  });
  const document = await createDocumentEndpoint({
    actor: stationActor,
    repository,
    body: {
      targetType: "Shipment",
      targetId: shipment.shipment.id,
      documentType: "Health certificate",
      description: "E2E mocked document metadata path.",
      originalFileName: "health-certificate.pdf",
      contentType: "application/pdf",
      fileSizeBytes: 2048,
      checksumSha256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      storageProvider: "mock",
      storageBucket: "e2e-documents",
      storageObjectKey: "e2e/health-certificate.pdf",
      storageRegion: null,
      storageVersionId: null,
      accessClassification: "ORDER_PARTICIPANTS",
      createdAt: timestamp,
    },
  });
  const documentNotificationResult = await notificationService.sendDocumentUploadNotification(
    document.body.document,
  );
  const breederDocumentView = await getDocumentEndpoint({
    actor: breederActor,
    repository,
    params: {
      documentId: document.body.document.id,
    },
    body: {},
  });

  assert.equal(breederOrganization.organization.id, breederOrganizationId);
  assert.equal(stationOrganization.organization.id, stationOrganizationId);
  assert.equal(breederInvitation.emailDelivery.status, "QUEUED");
  assert.equal(stationInvitation.emailDelivery.status, "QUEUED");
  assert.equal(acceptedBreeder.landingHref, "/breeder-dashboard");
  assert.equal(acceptedStation.landingHref, "/station-dashboard");
  assert.equal(stallion.status, 201);
  assert.equal(listing.status, 201);
  assert.equal(
    (await repository.listSemenListings()).some((record) => record.id === listing.body.listing.id),
    true,
  );
  assert.equal(draft.order.status, "DRAFT");
  assert.equal(submitted.order.status, "SUBMITTED");
  assert.equal(received.order.status, "RECEIVED");
  assert.equal(confirmed.order.status, "CONFIRMED");
  assert.equal(shipment.shipment.status, "PREPARED");
  assert.equal(shipmentUpdate.shipment.status, "IN_TRANSIT");
  assert.equal(document.status, 201);
  assert.equal(documentNotificationResult.ok, true);
  assert.equal(documentNotificationResult.skipped, false);
  assert.equal(breederDocumentView.status, 200);
  assert.equal(breederDocumentView.body.document.id, document.body.document.id);
  assert.equal(repository.listShipmentsForOrderSync(confirmed.order.id).length, 1);
  assert.equal(repository.listDocumentsForOrderSync(confirmed.order.id).length, 1);
  assertAuditSources(repository.auditLogs, [
    "ORGANIZATION_CREATED",
    "ROLE_ASSIGNED",
    "STALLION_CREATED",
    "SEMEN_LISTING_CREATED",
    "SEMEN_ORDER_DRAFT_CREATED",
    "SEMEN_ORDER_SUBMITTED",
    "SEMEN_ORDER_RECEIVED",
    "SEMEN_ORDER_CONFIRMED",
    "SHIPMENT_CREATED",
    "SHIPMENT_STATUS_UPDATED",
    "DOCUMENT_UPLOADED",
    "DOCUMENT_VIEWED",
  ]);
  assertProofEvents(repository.proofEvents, [
    "SEMEN_ORDER_CREATED",
    "SUBMITTED",
    "CONFIRMED",
    "SHIPMENT_CREATED",
    "SHIPMENT_STATUS_UPDATED",
  ]);
  assertNotificationEvents(repository.notificationLogs, [
    "ORDER_SUBMITTED",
    "ORDER_RECEIVED",
    "ORDER_CONFIRMED",
    "SHIPMENT_CREATED",
    "SHIPMENT_STATUS_UPDATED",
    "DOCUMENT_UPLOADED",
  ]);
  assert.deepEqual(
    sentEmails.map((message) => message.templateId),
    [
      "order.submitted.station",
      "order.received.breeder",
      "order.confirmed.breeder",
      "shipment.created.breeder",
      "shipment.updated.breeder",
      "document.uploaded.relevant_role",
    ],
  );
  assert.equal(repository.listOrderStatusHistorySync(confirmed.order.id).length, 4);
  assert.equal(repository.findSemenOrderByIdSync(confirmed.order.id).breederOrganizationId, breederOrganizationId);
});

function actor(userId, roleCode, organizationId) {
  return Object.freeze({
    userId,
    organizationId,
    roles: Object.freeze([
      Object.freeze({
        userId,
        organizationId,
        roleCode,
        revokedAt: null,
      }),
    ]),
  });
}

function createE2eRepository() {
  const stallions = new Map();
  const listings = new Map();
  const orders = new Map();
  const orderHistory = new Map();
  const shipments = new Map();
  const shipmentEvents = new Map();
  const documents = new Map();
  const users = new Map([
    [
      adminActor.userId,
      {
        id: adminActor.userId,
        managedAuthSubject: "local|e2e-admin",
        email: "admin.e2e@example.test",
        displayName: "E2E Admin",
        status: "ACTIVE",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
  ]);
  const organizations = new Map([
    [
      platformOrganizationId,
      {
        id: platformOrganizationId,
        name: "E2E Platform",
        organizationType: "PLATFORM",
        status: "ACTIVE",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
  ]);
  const userOrganizationRoles = new Map([
    [
      "e2e-role-admin",
      {
        id: "e2e-role-admin",
        userId: adminActor.userId,
        organizationId: platformOrganizationId,
        roleCode: "PLATFORM_ADMIN",
        assignedByUserId: adminActor.userId,
        assignmentReason: "E2E platform admin seed.",
        effectiveAt: timestamp,
        revokedAt: null,
        revokedByUserId: null,
        revocationReason: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
  ]);
  const invitations = new Map();
  const proofEvents = new Map();
  const auditLogs = [];
  const notificationLogs = [];
  let orderSequence = 1;
  let historySequence = 1;
  let shipmentSequence = 1;
  let shipmentEventSequence = 1;
  let documentSequence = 1;
  let userSequence = 1;
  let roleAssignmentSequence = 1;
  let invitationSequence = 1;
  let auditSequence = 1;
  let notificationSequence = 1;
  let proofSequence = 1;

  return {
    auditLogs,
    notificationLogs,
    proofEvents: [...proofEvents.values()],
    async listUsers() {
      return [...users.values()];
    },
    async getUserById(userId) {
      return users.get(userId) ?? null;
    },
    async findUserByEmail(email) {
      return [...users.values()].find((user) => user.email === email) ?? null;
    },
    async createUser(user) {
      const persisted = {
        ...user,
        id: user.email === breederEmail
          ? "e2e-user-breeder"
          : user.email === stationEmail
            ? "e2e-user-station"
            : user.id ?? `e2e-user-${userSequence++}`,
      };
      users.set(persisted.id, persisted);
      return persisted;
    },
    async updateUserProfile(user) {
      users.set(user.id, user);
      return user;
    },
    async updateUser(user) {
      users.set(user.id, user);
      return user;
    },
    async listOrganizations() {
      return [...organizations.values()];
    },
    async getOrganizationById(organizationId) {
      return organizations.get(organizationId) ?? null;
    },
    async createOrganization(input) {
      const id = input.organizationType === "BREEDING_STATION"
        ? stationOrganizationId
        : input.organizationType === "BREEDER"
          ? breederOrganizationId
          : `e2e-org-${organizations.size + 1}`;
      const persisted = {
        id,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...input,
      };
      organizations.set(persisted.id, persisted);
      return persisted;
    },
    async updateOrganization(organization) {
      organizations.set(organization.id, organization);
      return organization;
    },
    async listUserOrganizationRoles() {
      return [...userOrganizationRoles.values()];
    },
    async createUserOrganizationRole(input) {
      const persisted = {
        ...input,
        id: input.id ?? `e2e-role-assignment-${roleAssignmentSequence++}`,
      };
      userOrganizationRoles.set(persisted.id, persisted);
      return persisted;
    },
    async createInvitation(invitation) {
      const persisted = {
        ...invitation,
        id: invitation.id ?? `e2e-invitation-${invitationSequence++}`,
      };
      invitations.set(persisted.tokenHash, persisted);
      return persisted;
    },
    async updateInvitation(invitation) {
      invitations.set(invitation.tokenHash, invitation);
      return invitation;
    },
    async findInvitationByTokenHash(tokenHash) {
      return invitations.get(tokenHash) ?? null;
    },
    async queueInvitationEmail() {
      return undefined;
    },
    async listNotificationRecipients(query) {
      return [...userOrganizationRoles.values()]
        .filter((assignment) =>
          assignment.revokedAt == null &&
          (!query.organizationId || assignment.organizationId === query.organizationId) &&
          (!query.roleCode || assignment.roleCode === query.roleCode) &&
          (!query.excludeUserId || assignment.userId !== query.excludeUserId)
        )
        .map((assignment) => {
          const user = users.get(assignment.userId);

          return user?.status === "ACTIVE"
            ? {
                email: user.email,
                name: user.displayName,
                userId: user.id,
                organizationId: assignment.organizationId,
                roleCode: assignment.roleCode,
              }
            : null;
        })
        .filter(Boolean);
    },
    async findNotificationOrganizationById(organizationId) {
      const organization = organizations.get(organizationId);

      return organization
        ? {
            id: organization.id,
            name: organization.name,
          }
        : null;
    },
    async createNotificationLog(notificationLog) {
      const persisted = {
        ...notificationLog,
        id: notificationLog.id ?? `e2e-notification-${notificationSequence++}`,
      };
      notificationLogs.push(persisted);
      return persisted;
    },
    async createStallion(stallion) {
      const persisted = {
        ...stallion,
        id: stallion.id ?? `e2e-stallion-${stallions.size + 1}`,
      };
      stallions.set(persisted.id, persisted);
      return persisted;
    },
    async updateStallion(stallion) {
      stallions.set(stallion.id, stallion);
      return stallion;
    },
    async findStallionById(stallionId) {
      return stallions.get(stallionId) ?? null;
    },
    async listStallions() {
      return [...stallions.values()];
    },
    async createSemenListing(listing) {
      const persisted = {
        ...listing,
        id: listing.id ?? `e2e-listing-${listings.size + 1}`,
      };
      listings.set(persisted.id, persisted);
      return persisted;
    },
    async updateSemenListing(listing) {
      listings.set(listing.id, listing);
      return listing;
    },
    async findSemenListingById(listingId) {
      return listings.get(listingId) ?? null;
    },
    async listSemenListings() {
      return [...listings.values()];
    },
    async nextSemenOrderNumberSequence() {
      return orderSequence++;
    },
    async createSemenOrderWithStatusHistory(order, statusHistory) {
      const persistedOrder = {
        ...order,
        id: order.id ?? `e2e-order-${orders.size + 1}`,
      };
      const persistedHistory = {
        ...statusHistory,
        id: statusHistory.id ?? `e2e-history-${historySequence++}`,
        semenOrderId: persistedOrder.id,
      };
      orders.set(persistedOrder.id, persistedOrder);
      orderHistory.set(persistedOrder.id, [persistedHistory]);
      return {
        order: persistedOrder,
        statusHistory: persistedHistory,
      };
    },
    async updateSemenOrderWithStatusHistory(order, statusHistory) {
      const persistedOrder = { ...order };
      const persistedHistory = {
        ...statusHistory,
        id: statusHistory.id ?? `e2e-history-${historySequence++}`,
        semenOrderId: persistedOrder.id,
      };
      const timeline = orderHistory.get(persistedOrder.id) ?? [];
      orders.set(persistedOrder.id, persistedOrder);
      timeline.push(persistedHistory);
      orderHistory.set(persistedOrder.id, timeline);
      return {
        order: persistedOrder,
        statusHistory: persistedHistory,
      };
    },
    async updateDraftSemenOrder(order) {
      orders.set(order.id, order);
      return order;
    },
    async findSemenOrderById(orderId) {
      return orders.get(orderId) ?? null;
    },
    findSemenOrderByIdSync(orderId) {
      return orders.get(orderId) ?? null;
    },
    async listOrderStatusHistory(orderId) {
      return orderHistory.get(orderId) ?? [];
    },
    listOrderStatusHistorySync(orderId) {
      return orderHistory.get(orderId) ?? [];
    },
    async createShipmentWithTrackingEvent(shipment, trackingEvent) {
      const persistedShipment = {
        ...shipment,
        id: shipment.id ?? `e2e-shipment-${shipmentSequence++}`,
      };
      const persistedEvent = {
        ...trackingEvent,
        id: trackingEvent.id ?? `e2e-shipment-event-${shipmentEventSequence++}`,
        shipmentId: persistedShipment.id,
      };
      shipments.set(persistedShipment.id, persistedShipment);
      shipmentEvents.set(persistedShipment.id, [persistedEvent]);
      return {
        shipment: persistedShipment,
        trackingEvent: persistedEvent,
      };
    },
    async findShipmentById(shipmentId) {
      return shipments.get(shipmentId) ?? null;
    },
    async updateShipmentWithTrackingEvent(shipment, trackingEvent) {
      const persistedShipment = { ...shipment };
      const persistedEvent = {
        ...trackingEvent,
        id: trackingEvent.id ?? `e2e-shipment-event-${shipmentEventSequence++}`,
        shipmentId: persistedShipment.id,
      };
      const timeline = shipmentEvents.get(persistedShipment.id) ?? [];
      shipments.set(persistedShipment.id, persistedShipment);
      timeline.push(persistedEvent);
      shipmentEvents.set(persistedShipment.id, timeline);
      return {
        shipment: persistedShipment,
        trackingEvent: persistedEvent,
      };
    },
    async listShipmentsForOrder(orderId) {
      return this.listShipmentsForOrderSync(orderId);
    },
    listShipmentsForOrderSync(orderId) {
      return [...shipments.values()].filter((shipment) => shipment.semenOrderId === orderId);
    },
    async listShipmentTrackingEvents(shipmentId) {
      return shipmentEvents.get(shipmentId) ?? [];
    },
    async createDocument(document) {
      const persisted = {
        ...document,
        id: document.id ?? `e2e-document-${documentSequence++}`,
      };
      documents.set(persisted.id, persisted);
      return persisted;
    },
    async updateDocument(document) {
      documents.set(document.id, document);
      return document;
    },
    async findDocumentById(documentId) {
      return documents.get(documentId) ?? null;
    },
    async listDocumentsForOrder(orderId) {
      return this.listDocumentsForOrderSync(orderId);
    },
    listDocumentsForOrderSync(orderId) {
      return [...documents.values()].filter((document) => document.semenOrderId === orderId);
    },
    async listDocumentsForShipment(shipmentId) {
      return [...documents.values()].filter((document) => document.shipmentId === shipmentId);
    },
    async findProofEventById(proofEventId) {
      return proofEvents.get(proofEventId) ?? null;
    },
    async createEvidenceAttachment(evidenceAttachment) {
      return evidenceAttachment;
    },
    async listEvidenceAttachmentsForProofEvent() {
      return [];
    },
    async createAuditLog(auditLog) {
      const persisted = {
        ...auditLog,
        id: auditLog.id ?? `e2e-audit-${auditSequence++}`,
      };
      auditLogs.push(persisted);
      return persisted;
    },
    async createProofEvent(proofEvent) {
      const persisted = {
        ...proofEvent,
        id: proofEvent.id ?? `e2e-proof-${proofSequence++}`,
      };
      proofEvents.set(persisted.id, persisted);
      this.proofEvents = [...proofEvents.values()];
      return persisted;
    },
    async listProofEventsForShipment(shipmentId) {
      return [...proofEvents.values()].filter((proofEvent) => proofEvent.shipmentId === shipmentId);
    },
  };
}

function assertAuditSources(auditLogs, expectedSources) {
  const sources = auditLogs.map((auditLog) => auditLog.sourceAction);

  for (const source of expectedSources) {
    assert.equal(sources.includes(source), true, `missing audit source ${source}`);
  }
}

function assertProofEvents(proofEvents, expectedEventTypes) {
  const eventTypes = proofEvents.map((proofEvent) => proofEvent.eventType);

  for (const eventType of expectedEventTypes) {
    assert.equal(
      eventTypes.includes(eventType),
      true,
      `missing proof event ${eventType}; found ${eventTypes.join(", ")}`,
    );
  }
}

function assertNotificationEvents(notificationLogs, expectedEventTypes) {
  const eventTypes = notificationLogs.map((notificationLog) => notificationLog.eventType);

  for (const eventType of expectedEventTypes) {
    assert.equal(
      eventTypes.includes(eventType),
      true,
      `missing notification event ${eventType}; found ${eventTypes.join(", ")}`,
    );
  }
}
