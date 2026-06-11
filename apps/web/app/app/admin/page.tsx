import { headers } from "next/headers";

import {
  Badge,
  Button,
  ButtonLink,
  Card,
  DashboardShell,
  Field,
  Input,
  MetricCard,
  Notice,
  PageHeader,
  SectionHeader,
  Select,
  StatusBadge,
  Table,
} from "../../../components/ui";
import {
  createAdminDashboardViewModel,
  formatLabel,
  recordAdminDashboardAccess,
} from "../../../features/admin-dashboard/admin-dashboard.mjs";
import { createPrismaAmendmentRepository } from "../../../features/admin-amendments/prisma-amendment-repository";
import { createPrismaAuditLogRepository } from "../../../features/audit-logs/prisma-audit-log-repository";
import { requireActiveContextActor } from "../../../features/auth/active-context-server";
import { createPrismaDocumentRepository } from "../../../features/documents/prisma-document-repository";
import { adminNavigation } from "../../../features/navigation";
import { createPrismaSemenOrderRepository } from "../../../features/order-creation/prisma-semen-order-repository";
import { createPrismaShipmentRepository } from "../../../features/shipments/prisma-shipment-repository";
import { createPrismaSupportRequestRepository } from "../../../features/support-requests/prisma-support-request-repository";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const requestHeaders = await headers();
  const orderRepository = createPrismaSemenOrderRepository();
  const shipmentRepository = createPrismaShipmentRepository();
  const documentRepository = createPrismaDocumentRepository();
  const auditRepository = createPrismaAuditLogRepository();
  const supportRepository = createPrismaSupportRequestRepository();
  const amendmentRepository = createPrismaAmendmentRepository();

  await recordAdminDashboardAccess({
    actor: activeContext,
    repository: auditRepository,
    requestContext: {
      userAgent: requestHeaders.get("user-agent"),
    },
  });

  const [
    orders,
    activeListings,
    shipments,
    proofEvents,
    orderStatusHistory,
    supportRequests,
    auditLogs,
    amendments,
  ] = await Promise.all([
    orderRepository.listSemenOrders({}),
    orderRepository.listOrderableSemenListingRecords(),
    shipmentRepository.listShipments({}),
    orderRepository.listProofEvents({ limit: null }),
    orderRepository.listAllOrderStatusHistory({}),
    supportRepository.listSupportRequests({ limit: 25 }),
    auditRepository.listAuditLogs({ limit: 10 }),
    amendmentRepository.listAmendments({ limit: 25 }),
  ]);
  const documents = await documentRepository.listDocumentsForOrders(
    orders.flatMap((order) => order.id ? [order.id] : []),
  );
  const viewModel = createAdminDashboardViewModel({
    actor: activeContext,
    orders,
    activeListingCount: activeListings.length,
    shipments,
    documents,
    proofEvents,
    orderStatusHistory,
    supportRequests,
    auditLogs,
    amendments,
  });

  return (
    <DashboardShell
      activeHref="/app/admin"
      navigation={adminNavigation}
      organizationName={activeContext.organizationName}
      roleLabel="Platform Admin"
    >
      <div className="ct-page-stack">
        <PageHeader
          eyebrow="Platform admin"
          subtitle="Operational oversight for support, proof, audit and controlled access workflows."
          title="Admin overview"
        />
        <section aria-label="Admin operational overview" className="ct-metric-grid">
          {viewModel.metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              meta={metric.meta}
              value={metric.value}
            />
          ))}
        </section>
        <Card aria-labelledby="admin-operational-reporting-heading">
          <SectionHeader
            count={`${viewModel.operationalReport.metrics.length} metrics`}
            id="admin-operational-reporting-heading"
            subtitle={`Generated ${viewModel.operationalReport.generatedAt}`}
            title="Operational reporting"
          />
          <Table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>
              {viewModel.operationalReport.metrics.map((metric) => (
                <tr key={metric.key}>
                  <td>{metric.label}</td>
                  <td>{metric.displayValue}</td>
                  <td>{metric.meta}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <Card aria-labelledby="admin-search-heading">
          <SectionHeader
            id="admin-search-heading"
            subtitle="Search routes through the order support workspace, where detail access is logged."
            title="Order search"
          />
          <form action={viewModel.orderSearch.action} className="ct-form-grid ct-form-grid--filters" method="get">
            <Field htmlFor="admin-dashboard-order-query" label="Search">
              <Input
                id="admin-dashboard-order-query"
                name={viewModel.orderSearch.queryParam}
                placeholder="Order number, breeder or station"
              />
            </Field>
            <Field htmlFor="admin-dashboard-order-status" label="Status">
              <Select id="admin-dashboard-order-status" name={viewModel.orderSearch.statusParam}>
                <option value="">All statuses</option>
                {viewModel.orderStatusSummary.map((item) => (
                  <option key={item.status} value={item.status}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="ct-form-actions">
              <Button type="submit">Search orders</Button>
              <ButtonLink href={viewModel.routes.orders} variant="secondary">
                Open all orders
              </ButtonLink>
            </div>
          </form>
        </Card>
        <div className="ct-card-grid">
          <Card aria-labelledby="admin-action-required-heading">
            <SectionHeader
              count={`${viewModel.actionRequired.items.length} open`}
              id="admin-action-required-heading"
              title={viewModel.actionRequired.title}
            />
            {viewModel.actionRequired.items.length === 0 ? (
              <p className="ct-empty-state">{viewModel.actionRequired.emptyMessage}</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Priority</th>
                    <th>Updated</th>
                    <th>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {viewModel.actionRequired.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.title}</strong>
                        <span>{item.objectLabel}</span>
                      </td>
                      <td><StatusBadge label={formatLabel(item.priority)} value={item.priority} /></td>
                      <td>{item.dueAt ?? item.updatedAt ?? item.createdAt ?? "Not recorded"}</td>
                      <td>
                        {item.href ? (
                          <ButtonLink href={item.href} variant="secondary">
                            {item.actionLabel}
                          </ButtonLink>
                        ) : (
                          "Unavailable"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
          <Card aria-labelledby="admin-order-status-heading">
            <SectionHeader
              count={`${viewModel.orderStatusSummary.length} statuses`}
              id="admin-order-status-heading"
              title="Order status"
            />
            <Table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {viewModel.orderStatusSummary.map((item) => (
                  <tr key={item.status}>
                    <td><StatusBadge label={item.label} value={item.status} /></td>
                    <td>{item.count}</td>
                    <td>
                      <ButtonLink href={item.href} variant="secondary">
                        View
                      </ButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
          <Card aria-labelledby="admin-recent-orders-heading">
            <SectionHeader
              count={`${viewModel.recentOrders.length} recent`}
              id="admin-recent-orders-heading"
              title="Recent orders"
            />
            <Table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {viewModel.recentOrders.map((order) => (
                  <tr key={order.id ?? order.orderNumber}>
                    <td>{order.orderNumber}</td>
                    <td><StatusBadge label={formatLabel(order.status)} value={order.status} /></td>
                    <td>{order.updatedAt}</td>
                    <td>
                      <ButtonLink href={order.href} variant="secondary">
                        Inspect
                      </ButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
        <Card aria-labelledby="admin-workspaces-heading">
          <SectionHeader
            count={`${viewModel.navigationAreas.length} areas`}
            id="admin-workspaces-heading"
            subtitle="Available entries open implemented workspaces; planned entries document admin scope without inventing unfinished flows."
            title="Admin workspaces"
          />
          <div className="ct-card-grid">
            {viewModel.navigationAreas.map((area) => (
              <article className="ct-data-panel" key={area.key}>
                <span>{area.label}</span>
                <strong>{area.status === "available" ? "Available" : "Planned"}</strong>
                <Badge tone={area.status === "available" ? "success" : "warning"}>
                  {area.status === "available" ? "Open" : "Later ticket"}
                </Badge>
                {area.status === "available" ? (
                  <ButtonLink href={area.href} variant="secondary">
                    Open
                  </ButtonLink>
                ) : (
                  <span>{area.href}</span>
                )}
              </article>
            ))}
          </div>
        </Card>
        <Notice
          action={(
            <ButtonLink href={viewModel.auditLogHref} variant="secondary">
              View audit logs
            </ButtonLink>
          )}
          title="Admin access is audit visible"
          tone="info"
        >
          {viewModel.auditLogging.note}
        </Notice>
        <Notice
          action={(
            <ButtonLink href={viewModel.amendmentCreateHref} variant="secondary">
              Amendment entry
            </ButtonLink>
          )}
          title="Amendment workflow boundary"
          tone="warning"
        >
          {viewModel.limitations.reason}
        </Notice>
      </div>
    </DashboardShell>
  );
}
