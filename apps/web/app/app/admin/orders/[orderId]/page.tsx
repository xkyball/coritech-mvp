import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import {
  listAuditLogsForObject,
} from "@coritech/domain/audit/audit-log.mjs";

import {
  ButtonLink,
  Card,
  DashboardShell,
  DetailList,
  Notice,
  PageHeader,
  SectionHeader,
  StatusBadge,
  Table,
} from "../../../../../components/ui";
import { requireActiveContextActor } from "../../../../../features/auth/active-context-server";
import {
  createAdminOrderSupportAccessDecision,
  createAdminOrderSupportDetailViewModel,
} from "../../../../../features/admin-order-support/admin-order-support.mjs";
import { createAuditLogViewerViewModel } from "../../../../../features/audit-logs/audit-log-viewer.mjs";
import { AuditLogTable } from "../../../../../features/audit-logs/AuditLogTable";
import { createPrismaAuditLogRepository } from "../../../../../features/audit-logs/prisma-audit-log-repository";
import { createPrismaDocumentRepository } from "../../../../../features/documents/prisma-document-repository";
import { OrderActivityPanel } from "../../../../../features/order-activity/OrderActivityPanel";
import { createPrismaOrderActivityRepository } from "../../../../../features/order-activity/prisma-order-activity-repository";
import { createPrismaSemenOrderRepository } from "../../../../../features/order-creation/prisma-semen-order-repository";
import { PaymentReferencePanel } from "../../../../../features/payment-references/PaymentReferencePanel";
import { saveManualPaymentReference } from "../../../../../features/payment-references/payment-reference-actions";
import { createPaymentReferencePanelViewModel } from "../../../../../features/payment-references/payment-reference-ui.mjs";
import { createPrismaPaymentReferenceRepository } from "../../../../../features/payment-references/prisma-payment-reference-repository";
import { ProofTimeline } from "../../../../../features/proof-timeline/ProofTimeline";
import { createPrismaShipmentRepository } from "../../../../../features/shipments/prisma-shipment-repository";
import { adminNavigation } from "../../../../../features/navigation";

type AdminOrderDetailParams =
  | Promise<{ orderId: string }>
  | { orderId: string };
type AdminOrderDetailSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export default async function AdminOrderSupportDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: AdminOrderDetailParams;
  searchParams?: AdminOrderDetailSearchParams;
}>) {
  const { orderId } = await params;
  const resolvedSearchParams = await searchParams;
  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const orderRepository = createPrismaSemenOrderRepository();
  const documentRepository = createPrismaDocumentRepository();
  const activityRepository = createPrismaOrderActivityRepository();
  const shipmentRepository = createPrismaShipmentRepository();
  const auditRepository = createPrismaAuditLogRepository();
  const paymentReferenceRepository = createPrismaPaymentReferenceRepository();
  const order = await orderRepository.findSemenOrderById(orderId);

  if (!order || !order.id) {
    notFound();
  }

  await auditRepository.recordRbacAccessDecision(
    createAdminOrderSupportAccessDecision({
      actor: activeContext,
      handlerName: "AdminOrderSupportDetailPage",
      order,
    }),
    {
      userAgent: (await headers()).get("user-agent"),
    },
  );

  const organizations = await orderRepository.listOrganizationsByIds([
    order.breederOrganizationId,
    order.breedingStationOrganizationId,
  ]);
  const [
    statusHistory,
    proofEvents,
    documents,
    shipments,
    shipmentTrackingEvents,
    orderActivities,
    auditLogs,
    paymentReference,
  ] = await Promise.all([
    orderRepository.listOrderStatusHistory(order.id),
    orderRepository.listProofEventsForOrder(order.id),
    documentRepository.listDocumentsForOrder(order.id),
    shipmentRepository.listShipments({ semenOrderId: order.id }),
    shipmentRepository.listShipmentTrackingEventsForOrders([order.id]),
    activityRepository.listOrderActivitiesForOrder(order.id),
    listAuditLogsForObject({
      actor: activeContext,
      objectContext: {
        objectType: "SemenOrder",
        objectId: order.id,
        breederOrganizationId: order.breederOrganizationId,
        breedingStationOrganizationId: order.breedingStationOrganizationId,
      },
      objectType: "SemenOrder",
      objectId: order.id,
      repository: auditRepository,
    }),
    paymentReferenceRepository.findLatestPaymentReferenceForOrder(order.id),
  ]);
  const viewModel = createAdminOrderSupportDetailViewModel({
    actor: activeContext,
    order,
    organizations,
    statusHistory,
    proofEvents,
    documents,
    shipments,
    shipmentTrackingEvents,
    orderActivities,
    auditLogs,
  });
  const auditViewModel = createAuditLogViewerViewModel({
    auditLogs: viewModel.auditLogs.slice(0, 8),
    filters: {
      objectType: "SemenOrder",
      objectId: order.id,
      limit: 8,
    },
  });
  const paymentReferenceViewModel = createPaymentReferencePanelViewModel({
    actor: activeContext,
    order,
    paymentReference,
    returnTo: `/app/admin/orders/${encodeURIComponent(order.id)}`,
    feedback: buildPaymentFeedback(resolvedSearchParams),
  });

  return (
    <DashboardShell
      activeHref="/app/admin/orders"
      navigation={adminNavigation}
      organizationName={activeContext.organizationName}
      roleLabel="Platform Admin"
    >
      <div className="ct-page-stack">
        <PageHeader
          actions={(
            <>
              <ButtonLink href={viewModel.amendmentHref} variant="primary">
                Start amendment
              </ButtonLink>
              <ButtonLink href={viewModel.auditHref} variant="secondary">
                Audit logs
              </ButtonLink>
            </>
          )}
          eyebrow="Platform admin"
          subtitle="Read-only operational context for support. Corrections must use amendment evidence."
          title={viewModel.order.orderNumber}
        />
        <Notice title="No silent overwrite" tone="warning">
          Proof-critical fields are read-only here. Use the amendment workflow to
          preserve original and amended values with a reason and audit evidence.
        </Notice>
        <Card aria-labelledby="admin-order-summary-heading">
          <SectionHeader
            count={viewModel.order.status}
            id="admin-order-summary-heading"
            title="Order context"
          />
          <DetailList
            items={[
              { term: "Status", value: <StatusBadge value={viewModel.order.status} /> },
              { term: "Breeder", value: viewModel.order.breederOrganizationName },
              { term: "Station", value: viewModel.order.breedingStationOrganizationName },
              { term: "Requested delivery", value: viewModel.order.requestedDeliveryDate ?? "Not recorded" },
              { term: "Mare", value: viewModel.order.mareName ?? "Not recorded" },
              { term: "Mare registration", value: viewModel.order.mareRegistrationReference ?? "Not recorded" },
              { term: "Mare breed", value: viewModel.order.mareBreed ?? "Not recorded" },
              { term: "Recipient or vet", value: viewModel.order.vetOrRecipientContact ?? "Not recorded" },
              { term: "Shipping contact", value: viewModel.order.shippingContactName ?? "Not recorded" },
              { term: "Shipping phone", value: viewModel.order.shippingContactPhone ?? "Not recorded" },
              { term: "Shipping destination", value: viewModel.order.shippingDestination },
              { term: "Special instructions", value: viewModel.order.specialInstructions ?? "None" },
            ]}
          />
        </Card>
        <PaymentReferencePanel
          action={saveAdminPaymentReferenceCommand}
          viewModel={paymentReferenceViewModel}
        />
        <Card aria-labelledby="admin-order-status-heading">
          <SectionHeader
            count={`${viewModel.statusHistory.length} events`}
            id="admin-order-status-heading"
            title="Status history"
          />
          <Table>
            <thead>
              <tr>
                <th>Changed</th>
                <th>From</th>
                <th>To</th>
                <th>Actor</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {viewModel.statusHistory.map((event) => (
                <tr key={event.id ?? `${event.toStatus}:${event.changedAt}`}>
                  <td>{event.changedAt}</td>
                  <td>{event.fromStatus ?? "Initial"}</td>
                  <td><StatusBadge value={event.toStatus} /></td>
                  <td>{event.actorRoleCode}</td>
                  <td>{event.reason ?? "No reason recorded"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <Card aria-labelledby="admin-order-proof-heading">
          <SectionHeader
            count={`${viewModel.proofTimeline.items.length} events`}
            id="admin-order-proof-heading"
            title="Proof timeline"
          />
          <ProofTimeline viewModel={viewModel.proofTimeline} />
        </Card>
        <Card aria-labelledby="admin-order-documents-heading">
          <SectionHeader
            count={`${viewModel.documents.length} documents`}
            id="admin-order-documents-heading"
            title="Linked documents"
          />
          <Table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Status</th>
                <th>Classification</th>
                <th>Uploaded</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {viewModel.documents.map((document) => (
                <tr key={document.id ?? document.storageObjectKey}>
                  <td>{document.originalFileName}</td>
                  <td><StatusBadge value={document.status} /></td>
                  <td>{document.accessClassification}</td>
                  <td>{document.createdAt}</td>
                  <td>
                    {document.id ? (
                      <ButtonLink href={`/app/documents/${document.id}`} variant="secondary">
                        Review
                      </ButtonLink>
                    ) : "Not available"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <Card aria-labelledby="admin-order-shipment-heading">
          <SectionHeader
            count={`${viewModel.shipments.length} shipments`}
            id="admin-order-shipment-heading"
            title="Shipment context"
          />
          <Table>
            <thead>
              <tr>
                <th>Shipment</th>
                <th>Status</th>
                <th>Provider</th>
                <th>Tracking</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {viewModel.shipments.map((shipment) => (
                <tr key={shipment.id ?? shipment.orderNumber}>
                  <td>{shipment.id ?? shipment.orderNumber}</td>
                  <td><StatusBadge value={shipment.status} /></td>
                  <td>{shipment.providerName ?? "Not recorded"}</td>
                  <td>{shipment.providerTrackingId ?? "Not recorded"}</td>
                  <td>{shipment.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="ct-section-divider">
            <SectionHeader
              count={`${viewModel.shipmentTrackingEvents.length} events`}
              id="admin-order-shipment-tracking-heading"
              title="Tracking events"
            />
            <Table>
              <thead>
                <tr>
                  <th>Occurred</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Location</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {viewModel.shipmentTrackingEvents.map((event) => (
                  <tr key={event.id ?? `${event.toStatus}:${event.occurredAt}`}>
                    <td>{event.occurredAt}</td>
                    <td><StatusBadge value={event.toStatus} /></td>
                    <td>{event.eventSource}</td>
                    <td>{event.location ?? "Not recorded"}</td>
                    <td>{event.notes ?? "No notes"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
        <Card aria-labelledby="admin-order-audit-heading">
          <SectionHeader
            actions={(
              <ButtonLink href={viewModel.auditHref} variant="secondary">
                Open full audit query
              </ButtonLink>
            )}
            count={`${auditViewModel.rows.length} entries`}
            id="admin-order-audit-heading"
            title="Audit log excerpt"
          />
          <AuditLogTable viewModel={auditViewModel} />
        </Card>
        <OrderActivityPanel
          orderId={order.id}
          viewModel={viewModel.activity}
        />
      </div>
    </DashboardShell>
  );
}

async function saveAdminPaymentReferenceCommand(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const orderRepository = createPrismaSemenOrderRepository();
  const paymentReferenceRepository = createPrismaPaymentReferenceRepository();
  const orderId = formValue(formData, "orderId");
  const returnTo = formValue(formData, "returnTo") || `/app/admin/orders/${encodeURIComponent(orderId)}`;
  const result = await saveManualPaymentReference({
    actor: activeContext,
    auditContext: {
      userAgent: (await headers()).get("user-agent"),
    },
    formData,
    orderRepository,
    paymentReferenceRepository,
  });

  if (!result.ok) {
    redirect(`${returnTo}?paymentError=${encodeURIComponent(result.issues.join("\n"))}`);
  }

  redirect(`${returnTo}?payment=saved`);
}

function buildPaymentFeedback(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const error = firstSearchParam(searchParams?.paymentError);
  const status = firstSearchParam(searchParams?.payment);

  if (error) {
    return {
      tone: "danger" as const,
      title: "Payment reference was blocked",
      message: error,
    };
  }

  if (status) {
    return {
      tone: "success" as const,
      title: "Payment reference saved",
      message: "Manual payment reference state was updated.",
    };
  }

  return undefined;
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}
