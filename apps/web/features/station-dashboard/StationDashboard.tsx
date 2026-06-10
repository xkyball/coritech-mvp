import type { ReactNode } from "react";
import {
  ButtonLink,
  Card,
  DashboardShell,
  EmptyState,
  ErrorState as UiErrorState,
  LoadingState as UiLoadingState,
  MetricCard,
  Notice,
  PageHeader,
  SectionHeader,
  StatusBadge,
  Table,
  formatStatusLabel,
} from "../../components/ui";
import { stationNavigation } from "../navigation";
import type {
  StationDashboardActionItem,
  StationDashboardDocumentRow,
  StationDashboardErrorViewModel,
  StationDashboardListingCard,
  StationDashboardLoadingViewModel,
  StationDashboardNotification,
  StationDashboardOrderRow,
  StationDashboardRenderableViewModel,
  StationDashboardSelectedOrder,
  StationDashboardShipmentAction,
  StationDashboardStatusSummaryItem,
  StationDashboardViewModel,
} from "./station-dashboard.d.ts";

export function StationDashboard({
  viewModel,
}: Readonly<{
  viewModel: StationDashboardRenderableViewModel;
}>) {
  if (viewModel.state === "LOADING") {
    return <LoadingState viewModel={viewModel} />;
  }

  if (viewModel.state === "ERROR") {
    return <ErrorState viewModel={viewModel} />;
  }

  return <ReadyDashboard viewModel={viewModel} />;
}

function ReadyDashboard({
  viewModel,
}: Readonly<{
  viewModel: StationDashboardViewModel;
}>) {
  const sections = viewModel.sections;

  return (
    <DashboardShell
      activeHref="/station-dashboard"
      navigation={stationNavigation}
      organizationName={viewModel.organizationContext.organizationName}
      roleLabel="Breeding Station"
    >
      <div className="ct-page-stack" data-organization-id={viewModel.organizationContext.organizationId}>
        <PageHeader
          actions={(
            <ButtonLink href={viewModel.navigation.listingManagementHref} variant="primary">
              Manage listings
            </ButtonLink>
          )}
          eyebrow="Station workspace"
          subtitle="A station-scoped operational view of listings, incoming orders, shipment updates, documents and notifications."
          title={viewModel.organizationContext.organizationName}
        />

        <Notice title="Station order workspace" tone="info">
          Order review, shipment readiness and proof-linked actions are surfaced in this dashboard until the dedicated station order management route is implemented.
        </Notice>

        <StatusSummary items={sections.orderStatusSummary.items} />
        <NotificationsSection items={sections.notifications.items} emptyMessage={sections.notifications.emptyMessage} title={sections.notifications.title} />
        {viewModel.selectedOrder ? <SelectedOrderSection order={viewModel.selectedOrder} /> : null}
        <ListingsSection items={sections.activeListings.items} emptyMessage={sections.activeListings.emptyMessage} title={sections.activeListings.title} />
        <OrdersSection items={sections.incomingOrders.items} emptyMessage={sections.incomingOrders.emptyMessage} title={sections.incomingOrders.title} />
        <ActionRequiredSection items={sections.ordersNeedingAction.items} emptyMessage={sections.ordersNeedingAction.emptyMessage} title={sections.ordersNeedingAction.title} />
        <ShipmentActionsSection items={sections.shipmentsToUpdate.items} emptyMessage={sections.shipmentsToUpdate.emptyMessage} title={sections.shipmentsToUpdate.title} />
        <DocumentsSection items={sections.recentDocuments.items} emptyMessage={sections.recentDocuments.emptyMessage} title={sections.recentDocuments.title} />
      </div>
    </DashboardShell>
  );
}

function LoadingState({
  viewModel,
}: Readonly<{
  viewModel: StationDashboardLoadingViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/station-dashboard"
      navigation={stationNavigation}
      organizationName={viewModel.title}
      roleLabel="Breeding Station"
    >
      <UiLoadingState message={viewModel.message} title={viewModel.title} />
    </DashboardShell>
  );
}

function ErrorState({
  viewModel,
}: Readonly<{
  viewModel: StationDashboardErrorViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/station-dashboard"
      navigation={stationNavigation}
      roleLabel="Breeding Station"
    >
      <UiErrorState message={viewModel.message} title={viewModel.title} />
    </DashboardShell>
  );
}

function StatusSummary({
  items,
}: Readonly<{
  items: readonly StationDashboardStatusSummaryItem[];
}>) {
  const visibleItems = items.filter((item) => item.count > 0);

  return (
    <section className="ct-metric-grid" aria-label="Order status summary">
      {visibleItems.length > 0 ? (
        visibleItems.map((item) => (
          <MetricCard
            key={item.status}
            label={formatStatus(item.status)}
            value={item.count}
          />
        ))
      ) : (
        <MetricCard label="No assigned orders" value="0" meta="No station order activity has been recorded." />
      )}
    </section>
  );
}

function NotificationsSection({
  title,
  emptyMessage,
  items,
}: Readonly<{
  title: string;
  emptyMessage: string;
  items: readonly StationDashboardNotification[];
}>) {
  return (
    <DashboardSection title={title} headingId="station-notifications-heading">
      {items.length === 0 ? (
        <EmptyMessage message={emptyMessage} />
      ) : (
        <div className="ct-card-grid">
          {items.map((item) => (
            <article className="ct-record-card" key={item.id}>
              <div className="ct-record-card__header">
                <h3>{item.title}</h3>
                <StatusBadge value={item.severity} />
              </div>
              <p>{item.description}</p>
              {item.href ? (
                <ButtonLink href={item.href} variant="ghost">
                  Review
                </ButtonLink>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}

function SelectedOrderSection({
  order,
}: Readonly<{
  order: StationDashboardSelectedOrder;
}>) {
  return (
    <DashboardSection title={`Order ${order.orderNumber}`} headingId="selected-order-heading">
      <div className="ct-detail-grid">
        <DetailTerm term="Status" value={formatStatus(order.status)} />
        <DetailTerm term="Requested delivery" value={order.requestedDeliveryDate ?? "Not recorded"} />
        <DetailTerm term="Contact" value={order.shippingContactName ?? "Not recorded"} />
        <DetailTerm term="Phone" value={order.shippingContactPhone ?? "Not recorded"} />
        <DetailTerm term="Destination" value={order.shippingDestination ?? "Not recorded"} />
        <DetailTerm term="Instructions" value={order.specialInstructions ?? "None"} />
      </div>

      {order.actions.length > 0 ? (
        <div className="ct-card-grid">
          {order.actions.map((action) => (
            <ActionCard action={action} key={action.id} />
          ))}
        </div>
      ) : null}

      <Table>
        <thead>
          <tr>
            <th>Timeline</th>
            <th>Actor</th>
            <th>Reason</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {order.statusHistory.length > 0 ? (
            order.statusHistory.map((history) => (
              <tr key={history.id ?? `${history.orderNumber}:${history.changedAt}`}>
                <td>{history.fromStatus ? `${formatStatus(history.fromStatus)} to ${formatStatus(history.toStatus)}` : formatStatus(history.toStatus)}</td>
                <td>{formatStatus(history.actorRoleCode)}</td>
                <td>{history.reason ?? "Not recorded"}</td>
                <td>{history.changedAt}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4}>No status history has been recorded.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </DashboardSection>
  );
}

function ListingsSection({
  title,
  emptyMessage,
  items,
}: Readonly<{
  title: string;
  emptyMessage: string;
  items: readonly StationDashboardListingCard[];
}>) {
  return (
    <DashboardSection title={title} headingId="station-active-listings-heading">
      {items.length === 0 ? (
        <EmptyMessage message={emptyMessage} />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Stallion</th>
              <th>Breed</th>
              <th>Availability</th>
              <th>Terms</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {items.map((listing) => (
              <tr key={listing.id ?? listing.stallionId}>
                <td>{listing.stallionName}</td>
                <td>{listing.breed}</td>
                <td><StatusBadge value={listing.availabilityStatus} /></td>
                <td>{listing.termsSummary ?? "Not specified"}</td>
                <td>
                  {listing.managementHref ? (
                    <ButtonLink href={listing.managementHref} variant="ghost">
                      Manage
                    </ButtonLink>
                  ) : (
                    <StatusBadge value="unavailable" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </DashboardSection>
  );
}

function OrdersSection({
  title,
  emptyMessage,
  items,
}: Readonly<{
  title: string;
  emptyMessage: string;
  items: readonly StationDashboardOrderRow[];
}>) {
  return (
    <DashboardSection title={title} headingId="station-incoming-orders-heading">
      {items.length === 0 ? (
        <EmptyMessage message={emptyMessage} />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Requested delivery</th>
              <th>Latest movement</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {items.map((order) => (
              <tr key={order.id ?? order.orderNumber}>
                <td>{order.orderNumber}</td>
                <td><StatusBadge value={order.status} /></td>
                <td>{order.requestedDeliveryDate ?? "Not recorded"}</td>
                <td>{order.latestStatusChange ? `${formatStatus(order.latestStatusChange.toStatus)} at ${order.latestStatusChange.changedAt}` : "No status history"}</td>
                <td>
                  {order.detailHref ? (
                    <ButtonLink href={order.detailHref} variant="ghost">
                      Details
                    </ButtonLink>
                  ) : (
                    <StatusBadge value="unavailable" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </DashboardSection>
  );
}

function ActionRequiredSection({
  title,
  emptyMessage,
  items,
}: Readonly<{
  title: string;
  emptyMessage: string;
  items: readonly StationDashboardActionItem[];
}>) {
  return (
    <DashboardSection title={title} headingId="station-orders-needing-action-heading">
      {items.length === 0 ? (
        <EmptyMessage message={emptyMessage} />
      ) : (
        <div className="ct-card-grid">
          {items.map((item) => <ActionCard action={item} key={item.id} />)}
        </div>
      )}
    </DashboardSection>
  );
}

function ShipmentActionsSection({
  title,
  emptyMessage,
  items,
}: Readonly<{
  title: string;
  emptyMessage: string;
  items: readonly StationDashboardShipmentAction[];
}>) {
  return (
    <DashboardSection title={title} headingId="station-shipments-to-update-heading">
      {items.length === 0 ? (
        <EmptyMessage message={emptyMessage} />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Shipment</th>
              <th>Status</th>
              <th>Evidence</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.orderNumber}</td>
                <td>{item.shipmentId ?? "Not created"}</td>
                <td><StatusBadge value={item.status} /></td>
                <td>{item.auditProofReady ? `${formatStatus(item.auditAction)} / ${formatStatus(item.proofSource)}` : "Display only"}</td>
                <td>
                  {item.actionHref ? (
                    <ButtonLink href={item.actionHref} variant="ghost">
                      {item.actionLabel}
                    </ButtonLink>
                  ) : (
                    <StatusBadge value="unavailable" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </DashboardSection>
  );
}

function DocumentsSection({
  title,
  emptyMessage,
  items,
}: Readonly<{
  title: string;
  emptyMessage: string;
  items: readonly StationDashboardDocumentRow[];
}>) {
  return (
    <DashboardSection title={title} headingId="station-recent-documents-heading">
      {items.length === 0 ? (
        <EmptyMessage message={emptyMessage} />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Order</th>
              <th>Access</th>
              <th>Status</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {items.map((document) => (
              <tr key={document.id ?? `${document.targetType}:${document.targetId}`}>
                <td>{document.originalFileName}</td>
                <td>{document.documentType}</td>
                <td>{document.orderNumber ?? document.targetId}</td>
                <td><StatusBadge value={document.accessClassification} /></td>
                <td><StatusBadge value={document.status} /></td>
                <td>
                  {isImplementedDocumentHref(document.detailHref) ? (
                    <ButtonLink href={document.detailHref ?? ""} variant="ghost">
                      View
                    </ButtonLink>
                  ) : (
                    <StatusBadge label="Metadata only" value="metadata_only" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </DashboardSection>
  );
}

function ActionCard({
  action,
}: Readonly<{
  action: StationDashboardActionItem;
}>) {
  return (
    <article
      className="ct-record-card"
      data-action-kind={action.actionKind}
      data-audit-action={action.auditAction ?? undefined}
      data-audit-proof-ready={action.auditProofReady ? "true" : "false"}
      data-proof-source={action.proofSource ?? undefined}
    >
      <div className="ct-record-card__header">
        <h3>{action.title}</h3>
        <StatusBadge value={action.status} />
      </div>
      <span>{action.orderNumber}</span>
      <p>{action.description}</p>
      <p>{action.auditProofReady && action.auditAction && action.proofSource ? `${formatStatus(action.auditAction)} / ${formatStatus(action.proofSource)}` : "Display action"}</p>
      {action.actionHref ? (
        <ButtonLink href={action.actionHref} variant={action.actionKind === "REJECT_ORDER" ? "danger" : "secondary"}>
          {action.actionLabel}
        </ButtonLink>
      ) : null}
    </article>
  );
}

function DashboardSection({
  title,
  headingId,
  children,
}: Readonly<{
  title: string;
  headingId: string;
  children: ReactNode;
}>) {
  return (
    <Card aria-labelledby={headingId}>
      <SectionHeader id={headingId} title={title} />
      {children}
    </Card>
  );
}

function DetailTerm({
  term,
  value,
}: Readonly<{
  term: string;
  value: ReactNode;
}>) {
  return (
    <div className="ct-data-panel">
      <span>{term}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyMessage({ message }: Readonly<{ message: string }>) {
  return <EmptyState message={message} title="Nothing to show yet" />;
}

function formatStatus(value: unknown) {
  return formatStatusLabel(value);
}

function isImplementedDocumentHref(href: string | null) {
  return Boolean(href);
}
