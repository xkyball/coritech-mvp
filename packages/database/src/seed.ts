import {
  AccessPermissionScope,
  AmendmentStatus,
  AmendmentTargetType,
  AuditLogAction,
  DocumentAccessClassification,
  DocumentLinkTargetType,
  OrganizationType,
  PrismaClient,
  ProofEventSource,
  ProofEventStatus,
  ProofEventType,
  RoleCode,
  RolePhase,
  SemenAvailabilityStatus,
  SemenListingStatus,
  SemenOrderStatus,
  ShipmentStatus,
  ShipmentTrackingEventSource,
  StallionStatus,
  VerificationLevelCode,
} from "./generated/client";

const prisma = new PrismaClient();

const ids = {
  platformOrg: "00000000-0000-4000-8000-000000000001",
  breederOrg: "00000000-0000-4000-8000-000000000002",
  stationOrg: "00000000-0000-4000-8000-000000000003",
  christophUser: "00000000-0000-4000-8000-000000000100",
  adminUser: "00000000-0000-4000-8000-000000000101",
  breederUser: "00000000-0000-4000-8000-000000000102",
  stationUser: "00000000-0000-4000-8000-000000000103",
  christophAdminRoleAssignment: "00000000-0000-4000-8000-000000000204",
  christophBreederRoleAssignment: "00000000-0000-4000-8000-000000000205",
  christophStationRoleAssignment: "00000000-0000-4000-8000-000000000206",
  adminRoleAssignment: "00000000-0000-4000-8000-000000000201",
  breederRoleAssignment: "00000000-0000-4000-8000-000000000202",
  stationRoleAssignment: "00000000-0000-4000-8000-000000000203",
  stallion: "00000000-0000-4000-8000-000000000301",
  semenListing: "00000000-0000-4000-8000-000000000302",
  semenOrder: "00000000-0000-4000-8000-000000000401",
  historyDraft: "00000000-0000-4000-8000-000000000402",
  historySubmitted: "00000000-0000-4000-8000-000000000403",
  historyReceived: "00000000-0000-4000-8000-000000000404",
  historyConfirmed: "00000000-0000-4000-8000-000000000405",
  shipment: "00000000-0000-4000-8000-000000000501",
  trackingEvent: "00000000-0000-4000-8000-000000000502",
  auditOrderCreated: "00000000-0000-4000-8000-000000000601",
  auditOrderConfirmed: "00000000-0000-4000-8000-000000000602",
  auditShipmentTracked: "00000000-0000-4000-8000-000000000603",
  auditDocumentUploaded: "00000000-0000-4000-8000-000000000604",
  auditAmendmentCreated: "00000000-0000-4000-8000-000000000605",
  proofOrderCreated: "00000000-0000-4000-8000-000000000701",
  proofOrderConfirmed: "00000000-0000-4000-8000-000000000702",
  proofShipment: "00000000-0000-4000-8000-000000000703",
  document: "00000000-0000-4000-8000-000000000801",
  evidenceAttachment: "00000000-0000-4000-8000-000000000802",
  accessPermission: "00000000-0000-4000-8000-000000000901",
  amendment: "00000000-0000-4000-8000-000000001001",
};

const occurredAt = new Date("2026-06-09T09:00:00.000Z");
const submittedAt = new Date("2026-06-09T09:20:00.000Z");
const receivedAt = new Date("2026-06-09T10:00:00.000Z");
const confirmedAt = new Date("2026-06-09T10:30:00.000Z");
const shippedAt = new Date("2026-06-09T12:00:00.000Z");
const documentAt = new Date("2026-06-09T12:15:00.000Z");

const seededUserIds = {
  christophUser: ids.christophUser,
};

async function main() {
  await seedRoles();
  await seedVerificationLevels();
  await seedOrganizations();
  await seedUsers();
  await seedRoleAssignments();
  await seedCatalog();
  await seedOrder();
  await seedShipment();
  await seedAuditLogs();
  await seedProofEvents();
  await seedDocumentAndEvidence();
  await seedAccessPermission();
  await seedAmendment();

  console.log("CoriTech development seed data is ready.");
}

async function seedRoles() {
  const roles = [
    {
      code: RoleCode.BREEDER,
      phase: RolePhase.PHASE_1,
      displayName: "Breeder",
      description: "Breeder organization user who can participate in owned semen ordering workflows.",
      isAssignableInPhase1: true,
    },
    {
      code: RoleCode.BREEDING_STATION,
      phase: RolePhase.PHASE_1,
      displayName: "Breeding Station",
      description: "Breeding station user who can manage station-owned listing and fulfillment workflows.",
      isAssignableInPhase1: true,
    },
    {
      code: RoleCode.PLATFORM_ADMIN,
      phase: RolePhase.PHASE_1,
      displayName: "Platform Admin",
      description: "CoriTech platform administrator authorized to manage foundational records.",
      isAssignableInPhase1: true,
    },
    {
      code: RoleCode.VET,
      phase: RolePhase.FUTURE_PREPARED,
      displayName: "Vet / Clinic",
      description: "Prepared role for later veterinary workflows; not assignable in Phase 1.",
      isAssignableInPhase1: false,
    },
    {
      code: RoleCode.FEDERATION,
      phase: RolePhase.FUTURE_PREPARED,
      displayName: "Federation / Studbook",
      description: "Prepared role for later federation or studbook workflows; not assignable in Phase 1.",
      isAssignableInPhase1: false,
    },
    {
      code: RoleCode.SALES_VENUE,
      phase: RolePhase.FUTURE_PREPARED,
      displayName: "Sales Venue",
      description: "Prepared role for later sales venue workflows; not assignable in Phase 1.",
      isAssignableInPhase1: false,
    },
    {
      code: RoleCode.BUYER,
      phase: RolePhase.FUTURE_PREPARED,
      displayName: "Buyer",
      description: "Prepared role for later controlled buyer workflows; not assignable in Phase 1.",
      isAssignableInPhase1: false,
    },
    {
      code: RoleCode.TECH_SUPPORT,
      phase: RolePhase.FUTURE_PREPARED,
      displayName: "Technical Support",
      description: "Prepared role for later time-bounded support workflows; not assignable in Phase 1.",
      isAssignableInPhase1: false,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: role,
      create: role,
    });
  }
}

async function seedVerificationLevels() {
  const levels = [
    {
      code: VerificationLevelCode.SELF_REPORTED,
      displayName: "Self-reported",
      description: "Participant-entered workflow fact.",
      isActiveInPhase1: true,
      sortOrder: 10,
    },
    {
      code: VerificationLevelCode.SYSTEM_RECORDED,
      displayName: "System-recorded",
      description: "Workflow event captured by the application.",
      isActiveInPhase1: true,
      sortOrder: 20,
    },
    {
      code: VerificationLevelCode.STATION_CONFIRMED,
      displayName: "Station-confirmed",
      description: "Workflow fact confirmed by the breeding station.",
      isActiveInPhase1: true,
      sortOrder: 30,
    },
    {
      code: VerificationLevelCode.ADMIN_REVIEWED,
      displayName: "Admin-reviewed",
      description: "Platform-admin review or correction recorded through approved workflows.",
      isActiveInPhase1: true,
      sortOrder: 40,
    },
    {
      code: VerificationLevelCode.VET_SIGNED,
      displayName: "Vet-signed",
      description: "Reserved for later veterinary signature workflows.",
      isActiveInPhase1: false,
      sortOrder: 50,
    },
    {
      code: VerificationLevelCode.FEDERATION_ATTESTED,
      displayName: "Federation-attested",
      description: "Reserved for later federation or studbook attestation workflows.",
      isActiveInPhase1: false,
      sortOrder: 60,
    },
    {
      code: VerificationLevelCode.VERIFIED_FOR_TRANSACTION,
      displayName: "Verified for transaction",
      description: "Reserved for later transaction-ready verification.",
      isActiveInPhase1: false,
      sortOrder: 70,
    },
  ];

  for (const level of levels) {
    await prisma.verificationLevel.upsert({
      where: { code: level.code },
      update: level,
      create: level,
    });
  }
}

async function seedOrganizations() {
  const organizations = [
    {
      id: ids.platformOrg,
      name: "CoriTech Platform",
      organizationType: OrganizationType.PLATFORM,
    },
    {
      id: ids.breederOrg,
      name: "Blue Oak Breeders",
      organizationType: OrganizationType.BREEDER,
    },
    {
      id: ids.stationOrg,
      name: "Highveld Breeding Station",
      organizationType: OrganizationType.BREEDING_STATION,
    },
  ];

  for (const organization of organizations) {
    await prisma.organization.upsert({
      where: { id: organization.id },
      update: organization,
      create: organization,
    });
  }
}

async function seedUsers() {
  const christophUser = await upsertSeedUserByEmail({
    id: ids.christophUser,
    managedAuthSubject: "local|christoph-jcim",
    email: "christoph@jcim.de",
    displayName: "Christoph Hoffmann",
  });

  seededUserIds.christophUser = christophUser.id;

  const users = [
    {
      id: ids.adminUser,
      managedAuthSubject: "local|platform-admin",
      email: "admin@coritech.local",
      displayName: "CoriTech Admin",
    },
    {
      id: ids.breederUser,
      managedAuthSubject: "local|blue-oak-breeder",
      email: "breeder@coritech.local",
      displayName: "Blue Oak Breeder",
    },
    {
      id: ids.stationUser,
      managedAuthSubject: "local|highveld-station",
      email: "station@coritech.local",
      displayName: "Highveld Station Manager",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }
}

async function upsertSeedUserByEmail(user: {
  id: string;
  managedAuthSubject: string;
  email: string;
  displayName: string;
}) {
  const existingByEmail = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (existingByEmail) {
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        displayName: user.displayName,
        status: "ACTIVE",
      },
    });
  }

  return prisma.user.create({
    data: user,
  });
}

async function seedRoleAssignments() {
  const assignments = [
    {
      id: ids.christophAdminRoleAssignment,
      userId: seededUserIds.christophUser,
      organizationId: ids.platformOrg,
      roleCode: RoleCode.PLATFORM_ADMIN,
      assignedByUserId: ids.adminUser,
      assignmentReason: "Local development all-roles user.",
    },
    {
      id: ids.christophBreederRoleAssignment,
      userId: seededUserIds.christophUser,
      organizationId: ids.breederOrg,
      roleCode: RoleCode.BREEDER,
      assignedByUserId: ids.adminUser,
      assignmentReason: "Local development all-roles user.",
    },
    {
      id: ids.christophStationRoleAssignment,
      userId: seededUserIds.christophUser,
      organizationId: ids.stationOrg,
      roleCode: RoleCode.BREEDING_STATION,
      assignedByUserId: ids.adminUser,
      assignmentReason: "Local development all-roles user.",
    },
    {
      id: ids.adminRoleAssignment,
      userId: ids.adminUser,
      organizationId: ids.platformOrg,
      roleCode: RoleCode.PLATFORM_ADMIN,
      assignedByUserId: ids.adminUser,
      assignmentReason: "Local development platform admin.",
    },
    {
      id: ids.breederRoleAssignment,
      userId: ids.breederUser,
      organizationId: ids.breederOrg,
      roleCode: RoleCode.BREEDER,
      assignedByUserId: ids.adminUser,
      assignmentReason: "Local development breeder user.",
    },
    {
      id: ids.stationRoleAssignment,
      userId: ids.stationUser,
      organizationId: ids.stationOrg,
      roleCode: RoleCode.BREEDING_STATION,
      assignedByUserId: ids.adminUser,
      assignmentReason: "Local development breeding station user.",
    },
  ];

  for (const assignment of assignments) {
    await prisma.userOrganizationRole.upsert({
      where: { id: assignment.id },
      update: assignment,
      create: assignment,
    });
  }
}

async function seedCatalog() {
  await prisma.stallion.upsert({
    where: { id: ids.stallion },
    update: {
      name: "Coriander Gold",
      breed: "Warmblood",
      ueln: "826002202600001",
      microchipNumber: "985141000000001",
      status: StallionStatus.ACTIVE,
      updatedByUserId: ids.stationUser,
    },
    create: {
      id: ids.stallion,
      breedingStationOrganizationId: ids.stationOrg,
      name: "Coriander Gold",
      breed: "Warmblood",
      ueln: "826002202600001",
      microchipNumber: "985141000000001",
      status: StallionStatus.ACTIVE,
      createdByUserId: ids.stationUser,
      updatedByUserId: ids.stationUser,
    },
  });

  await prisma.semenListing.upsert({
    where: { id: ids.semenListing },
    update: {
      availabilityStatus: SemenAvailabilityStatus.AVAILABLE,
      listingStatus: SemenListingStatus.ACTIVE,
      termsSummary: "Fresh chilled semen available by station confirmation.",
      updatedByUserId: ids.stationUser,
    },
    create: {
      id: ids.semenListing,
      stallionId: ids.stallion,
      breedingStationOrganizationId: ids.stationOrg,
      availabilityStatus: SemenAvailabilityStatus.AVAILABLE,
      listingStatus: SemenListingStatus.ACTIVE,
      termsSummary: "Fresh chilled semen available by station confirmation.",
      createdByUserId: ids.stationUser,
      updatedByUserId: ids.stationUser,
    },
  });
}

async function seedOrder() {
  await prisma.semenOrder.upsert({
    where: { id: ids.semenOrder },
    update: {
      status: SemenOrderStatus.CONFIRMED,
      requestedDeliveryDate: new Date("2026-06-12T00:00:00.000Z"),
      shippingContactName: "Blue Oak Breeder",
      shippingContactPhone: "+27 82 555 0101",
      shippingAddressLine1: "42 Foaling Barn Road",
      shippingAddressLine2: "Gate 3",
      shippingCity: "Pretoria",
      shippingRegion: "Gauteng",
      shippingPostalCode: "0081",
      shippingCountry: "South Africa",
      specialInstructions: "Call the breeder before dispatch.",
      updatedByUserId: ids.stationUser,
    },
    create: {
      id: ids.semenOrder,
      orderNumber: "SO-20260609-000001",
      semenListingId: ids.semenListing,
      breederOrganizationId: ids.breederOrg,
      breedingStationOrganizationId: ids.stationOrg,
      status: SemenOrderStatus.CONFIRMED,
      requestedDeliveryDate: new Date("2026-06-12T00:00:00.000Z"),
      shippingContactName: "Blue Oak Breeder",
      shippingContactPhone: "+27 82 555 0101",
      shippingAddressLine1: "42 Foaling Barn Road",
      shippingAddressLine2: "Gate 3",
      shippingCity: "Pretoria",
      shippingRegion: "Gauteng",
      shippingPostalCode: "0081",
      shippingCountry: "South Africa",
      specialInstructions: "Call the breeder before dispatch.",
      createdByUserId: ids.breederUser,
      updatedByUserId: ids.stationUser,
      createdAt: occurredAt,
      updatedAt: confirmedAt,
    },
  });

  const history = [
    {
      id: ids.historyDraft,
      fromStatus: null,
      toStatus: SemenOrderStatus.DRAFT,
      actorUserId: ids.breederUser,
      actorRoleCode: RoleCode.BREEDER,
      actorOrganizationId: ids.breederOrg,
      reason: "Draft created from active listing.",
      changedAt: occurredAt,
    },
    {
      id: ids.historySubmitted,
      fromStatus: SemenOrderStatus.DRAFT,
      toStatus: SemenOrderStatus.SUBMITTED,
      actorUserId: ids.breederUser,
      actorRoleCode: RoleCode.BREEDER,
      actorOrganizationId: ids.breederOrg,
      reason: "Submitted for station review.",
      changedAt: submittedAt,
    },
    {
      id: ids.historyReceived,
      fromStatus: SemenOrderStatus.SUBMITTED,
      toStatus: SemenOrderStatus.RECEIVED,
      actorUserId: ids.stationUser,
      actorRoleCode: RoleCode.BREEDING_STATION,
      actorOrganizationId: ids.stationOrg,
      reason: "Station received the order request.",
      changedAt: receivedAt,
    },
    {
      id: ids.historyConfirmed,
      fromStatus: SemenOrderStatus.RECEIVED,
      toStatus: SemenOrderStatus.CONFIRMED,
      actorUserId: ids.stationUser,
      actorRoleCode: RoleCode.BREEDING_STATION,
      actorOrganizationId: ids.stationOrg,
      reason: "Station confirmed availability and fulfillment window.",
      changedAt: confirmedAt,
    },
  ];

  await prisma.orderStatusHistory.createMany({
    data: history.map((row) => ({
      ...row,
      semenOrderId: ids.semenOrder,
      orderNumber: "SO-20260609-000001",
    })),
    skipDuplicates: true,
  });
}

async function seedShipment() {
  await prisma.shipment.upsert({
    where: { id: ids.shipment },
    update: {
      status: ShipmentStatus.DISPATCHED,
      providerName: "Manual Station Dispatch",
      providerTrackingId: "HBS-LOCAL-0001",
      trackingUrl: "https://tracking.example.local/HBS-LOCAL-0001",
      updatedByUserId: ids.stationUser,
    },
    create: {
      id: ids.shipment,
      semenOrderId: ids.semenOrder,
      orderNumber: "SO-20260609-000001",
      breederOrganizationId: ids.breederOrg,
      breedingStationOrganizationId: ids.stationOrg,
      status: ShipmentStatus.DISPATCHED,
      providerName: "Manual Station Dispatch",
      providerTrackingId: "HBS-LOCAL-0001",
      trackingUrl: "https://tracking.example.local/HBS-LOCAL-0001",
      createdByUserId: ids.stationUser,
      updatedByUserId: ids.stationUser,
      createdAt: shippedAt,
      updatedAt: shippedAt,
    },
  });

  await prisma.shipmentTrackingEvent.createMany({
    data: [
      {
        id: ids.trackingEvent,
        shipmentId: ids.shipment,
        semenOrderId: ids.semenOrder,
        orderNumber: "SO-20260609-000001",
        fromStatus: ShipmentStatus.PREPARED,
        toStatus: ShipmentStatus.DISPATCHED,
        eventSource: ShipmentTrackingEventSource.MANUAL,
        sourceEventId: "manual-dispatch-0001",
        providerStatus: "Released",
        location: "Highveld Breeding Station",
        notes: "Prepared and released for courier collection.",
        actorUserId: ids.stationUser,
        actorRoleCode: RoleCode.BREEDING_STATION,
        actorOrganizationId: ids.stationOrg,
        occurredAt: shippedAt,
        recordedAt: shippedAt,
      },
    ],
    skipDuplicates: true,
  });
}

async function seedAuditLogs() {
  const auditLogs = [
    {
      id: ids.auditOrderCreated,
      actorUserId: ids.breederUser,
      actorRoleCode: RoleCode.BREEDER,
      actorOrganizationId: ids.breederOrg,
      action: AuditLogAction.CREATE,
      sourceAction: "SEMEN_ORDER_DRAFT_CREATED",
      objectType: "SemenOrder",
      objectId: ids.semenOrder,
      objectRef: { orderNumber: "SO-20260609-000001" },
      newValues: { status: SemenOrderStatus.DRAFT },
      reason: "Local development order creation.",
      occurredAt,
    },
    {
      id: ids.auditOrderConfirmed,
      actorUserId: ids.stationUser,
      actorRoleCode: RoleCode.BREEDING_STATION,
      actorOrganizationId: ids.stationOrg,
      action: AuditLogAction.STATUS_CHANGE,
      sourceAction: "SEMEN_ORDER_CONFIRMED",
      objectType: "SemenOrder",
      objectId: ids.semenOrder,
      objectRef: { orderNumber: "SO-20260609-000001" },
      previousValues: { status: SemenOrderStatus.RECEIVED },
      newValues: { status: SemenOrderStatus.CONFIRMED },
      reason: "Station confirmed availability.",
      occurredAt: confirmedAt,
    },
    {
      id: ids.auditShipmentTracked,
      actorUserId: ids.stationUser,
      actorRoleCode: RoleCode.BREEDING_STATION,
      actorOrganizationId: ids.stationOrg,
      action: AuditLogAction.STATUS_CHANGE,
      sourceAction: "SHIPMENT_STATUS_UPDATED",
      objectType: "Shipment",
      objectId: ids.shipment,
      objectRef: { orderNumber: "SO-20260609-000001", providerTrackingId: "HBS-LOCAL-0001" },
      previousValues: { status: ShipmentStatus.PREPARED },
      newValues: { status: ShipmentStatus.DISPATCHED },
      reason: "Manual station dispatch event.",
      occurredAt: shippedAt,
    },
    {
      id: ids.auditDocumentUploaded,
      actorUserId: ids.stationUser,
      actorRoleCode: RoleCode.BREEDING_STATION,
      actorOrganizationId: ids.stationOrg,
      action: AuditLogAction.UPLOAD_DOCUMENT,
      sourceAction: "DOCUMENT_UPLOADED",
      objectType: "Document",
      objectId: ids.document,
      objectRef: { orderNumber: "SO-20260609-000001", documentType: "Station Confirmation" },
      newValues: { accessClassification: DocumentAccessClassification.ORDER_PARTICIPANTS },
      reason: "Station confirmation document metadata seeded.",
      occurredAt: documentAt,
    },
    {
      id: ids.auditAmendmentCreated,
      actorUserId: ids.adminUser,
      actorRoleCode: RoleCode.PLATFORM_ADMIN,
      actorOrganizationId: ids.platformOrg,
      action: AuditLogAction.CREATE_AMENDMENT,
      sourceAction: "ADMIN_CORRECTION_CREATED",
      objectType: "Amendment",
      objectId: ids.amendment,
      objectRef: { targetType: "SemenOrder", orderNumber: "SO-20260609-000001" },
      newValues: { targetField: "termsSummary" },
      reason: "Local development amendment evidence.",
      occurredAt: documentAt,
    },
  ];

  await prisma.auditLog.createMany({
    data: auditLogs,
    skipDuplicates: true,
  });
}

async function seedProofEvents() {
  const proofEvents = [
    {
      id: ids.proofOrderCreated,
      eventType: ProofEventType.SEMEN_ORDER_CREATED,
      source: ProofEventSource.ORDER_STATUS_CHANGE,
      triggerType: "SEMEN_ORDER_DRAFT_CREATED",
      triggerRef: { orderStatusHistoryId: ids.historyDraft },
      semenOrderId: ids.semenOrder,
      orderNumber: "SO-20260609-000001",
      breederOrganizationId: ids.breederOrg,
      breedingStationOrganizationId: ids.stationOrg,
      lifecycleStage: "ORDER_CREATED",
      verificationLevel: VerificationLevelCode.SELF_REPORTED,
      status: ProofEventStatus.RECORDED,
      actorUserId: ids.breederUser,
      actorRoleCode: RoleCode.BREEDER,
      actorOrganizationId: ids.breederOrg,
      documentationRefs: [],
      attestationRefs: [],
      auditLogId: ids.auditOrderCreated,
      auditHookRef: { auditLogId: ids.auditOrderCreated },
      occurredAt,
    },
    {
      id: ids.proofOrderConfirmed,
      eventType: ProofEventType.CONFIRMED,
      source: ProofEventSource.ORDER_STATUS_CHANGE,
      triggerType: "SEMEN_ORDER_CONFIRMED",
      triggerRef: { orderStatusHistoryId: ids.historyConfirmed },
      semenOrderId: ids.semenOrder,
      orderNumber: "SO-20260609-000001",
      breederOrganizationId: ids.breederOrg,
      breedingStationOrganizationId: ids.stationOrg,
      lifecycleStage: "STATION_CONFIRMATION",
      verificationLevel: VerificationLevelCode.STATION_CONFIRMED,
      status: ProofEventStatus.RECORDED,
      actorUserId: ids.stationUser,
      actorRoleCode: RoleCode.BREEDING_STATION,
      actorOrganizationId: ids.stationOrg,
      documentationRefs: [],
      signatureRef: { method: "managed-auth-session", subject: "local|highveld-station" },
      attestationRefs: [],
      auditLogId: ids.auditOrderConfirmed,
      auditHookRef: { auditLogId: ids.auditOrderConfirmed },
      occurredAt: confirmedAt,
    },
    {
      id: ids.proofShipment,
      eventType: ProofEventType.SHIPMENT_STATUS_UPDATED,
      source: ProofEventSource.SHIPMENT_TRACKING_EVENT,
      triggerType: "SHIPMENT_DISPATCHED",
      triggerRef: { shipmentTrackingEventId: ids.trackingEvent },
      semenOrderId: ids.semenOrder,
      shipmentId: ids.shipment,
      orderNumber: "SO-20260609-000001",
      breederOrganizationId: ids.breederOrg,
      breedingStationOrganizationId: ids.stationOrg,
      lifecycleStage: "SHIPMENT_TRACKING",
      verificationLevel: VerificationLevelCode.SYSTEM_RECORDED,
      status: ProofEventStatus.RECORDED,
      actorUserId: ids.stationUser,
      actorRoleCode: RoleCode.BREEDING_STATION,
      actorOrganizationId: ids.stationOrg,
      documentationRefs: [],
      attestationRefs: [],
      auditLogId: ids.auditShipmentTracked,
      auditHookRef: { auditLogId: ids.auditShipmentTracked },
      occurredAt: shippedAt,
    },
  ];

  await prisma.proofEvent.createMany({
    data: proofEvents,
    skipDuplicates: true,
  });
}

async function seedDocumentAndEvidence() {
  await prisma.document.upsert({
    where: { id: ids.document },
    update: {
      description: "Station confirmation metadata for the seeded order.",
      accessClassification: DocumentAccessClassification.ORDER_PARTICIPANTS,
      uploadedByUserId: ids.stationUser,
      uploaderRoleCode: RoleCode.BREEDING_STATION,
      uploaderOrganizationId: ids.stationOrg,
    },
    create: {
      id: ids.document,
      documentType: "Station Confirmation",
      description: "Station confirmation metadata for the seeded order.",
      targetType: DocumentLinkTargetType.SemenOrder,
      targetId: ids.semenOrder,
      semenOrderId: ids.semenOrder,
      orderNumber: "SO-20260609-000001",
      breederOrganizationId: ids.breederOrg,
      breedingStationOrganizationId: ids.stationOrg,
      originalFileName: "station-confirmation-so-20260609-000001.pdf",
      contentType: "application/pdf",
      fileSizeBytes: BigInt(24576),
      checksumSha256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      storageProvider: "S3_COMPATIBLE_PLACEHOLDER",
      storageBucket: "coritech-local-dev",
      storageObjectKey: "orders/SO-20260609-000001/station-confirmation.pdf",
      storageRegion: "local-dev",
      accessClassification: DocumentAccessClassification.ORDER_PARTICIPANTS,
      uploadedByUserId: ids.stationUser,
      uploaderRoleCode: RoleCode.BREEDING_STATION,
      uploaderOrganizationId: ids.stationOrg,
      createdAt: documentAt,
      updatedAt: documentAt,
    },
  });

  await prisma.evidenceAttachment.upsert({
    where: { id: ids.evidenceAttachment },
    update: {
      proofEventId: ids.proofOrderConfirmed,
      documentId: ids.document,
      attachedByUserId: ids.stationUser,
    },
    create: {
      id: ids.evidenceAttachment,
      proofEventId: ids.proofOrderConfirmed,
      documentId: ids.document,
      documentTargetType: DocumentLinkTargetType.SemenOrder,
      documentTargetId: ids.semenOrder,
      attachedByUserId: ids.stationUser,
      actorRoleCode: RoleCode.BREEDING_STATION,
      actorOrganizationId: ids.stationOrg,
      attachedAt: documentAt,
    },
  });
}

async function seedAccessPermission() {
  await prisma.accessPermission.upsert({
    where: { id: ids.accessPermission },
    update: {
      userId: ids.breederUser,
      objectType: "Document",
      objectId: ids.document,
      scope: AccessPermissionScope.VIEW_DOCUMENT,
      grantReason: "Seeded breeder document visibility for local review.",
    },
    create: {
      id: ids.accessPermission,
      userId: ids.breederUser,
      objectType: "Document",
      objectId: ids.document,
      scope: AccessPermissionScope.VIEW_DOCUMENT,
      grantedByUserId: ids.adminUser,
      grantorRoleCode: RoleCode.PLATFORM_ADMIN,
      grantorOrganizationId: ids.platformOrg,
      grantReason: "Seeded breeder document visibility for local review.",
      effectiveAt: documentAt,
    },
  });
}

async function seedAmendment() {
  await prisma.amendment.upsert({
    where: { id: ids.amendment },
    update: {
      reason: "Seeded correction record showing how proof-relevant amendments are captured.",
      status: AmendmentStatus.SUBMITTED,
      auditLogId: ids.auditAmendmentCreated,
    },
    create: {
      id: ids.amendment,
      targetType: AmendmentTargetType.SemenOrder,
      targetId: ids.semenOrder,
      targetField: "termsSummary",
      targetRef: { orderNumber: "SO-20260609-000001" },
      originalValue: { termsSummary: "Fresh chilled semen available by station confirmation." },
      amendedValue: { termsSummary: "Fresh chilled semen confirmed for local development review." },
      reason: "Seeded correction record showing how proof-relevant amendments are captured.",
      status: AmendmentStatus.SUBMITTED,
      actorUserId: ids.adminUser,
      actorRoleCode: RoleCode.PLATFORM_ADMIN,
      actorOrganizationId: ids.platformOrg,
      auditLogId: ids.auditAmendmentCreated,
      semenOrderId: ids.semenOrder,
      orderNumber: "SO-20260609-000001",
      breederOrganizationId: ids.breederOrg,
      breedingStationOrganizationId: ids.stationOrg,
      occurredAt: documentAt,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
