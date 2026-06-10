import type { ReactNode } from "react";
import {
  ButtonLink,
  Card,
  DashboardShell,
  EmptyState,
  ErrorState as UiErrorState,
  LoadingState as UiLoadingState,
  MetricCard,
  PageHeader,
  SectionHeader,
  StatusBadge,
  Table,
  formatStatusLabel,
} from "../../components/ui";
import { breederNavigation } from "../navigation";
import type {
  BreederDashboardActionItem,
  BreederDashboardDocumentRow,
  BreederDashboardErrorViewModel,
  BreederDashboardListingCard,
  BreederDashboardLoadingViewModel,
  BreederDashboardOrderRow,
  BreederDashboardRenderableViewModel,
  BreederDashboardStatusSummaryItem,
  BreederDashboardViewModel,
} from "./breeder-dashboard.d.ts";

export function BreederDashboard({
  viewModel,
}: Readonly<{
  viewModel: BreederDashboardRenderableViewModel;
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
  viewModel: BreederDashboardViewModel;
}>) {
  const sections = viewModel.sections;

  return (
    <DashboardShell
      activeHref="/breeder-dashboard"
      navigation={breederNavigation}
      organizationName={viewModel.organizationContext.organizationName}
      roleLabel="Breeder"
    >
      <div data-organization-id={viewModel.organizationContext.organizationId}>
        <PageHeader
          actions={(
            <ButtonLink href={viewModel.navigation.catalogHref} variant="primary">
              Browse catalog
            </ButtonLink>
          )}
          eyebrow="Breeder workspace"
          subtitle="A controlled view of order movement, available listings, documents and actions for this organization."
          title={viewModel.organizationContext.organizationName}
        />

        <StatusSummary items={sections.orderStatusSummary.items} />
        <ListingsSection items={sections.activeListings.items} emptyMessage={sections.activeListings.emptyMessage} title={sections.activeListings.title} />
        <OrdersSection items={sections.myOrders.items} emptyMessage={sections.myOrders.emptyMessage} title={sections.myOrders.title} />
        <DocumentsSection items={sections.recentDocuments.items} emptyMessage={sections.recentDocuments.emptyMessage} title={sections.recentDocuments.title} />
        <ActionRequiredSection items={sections.actionRequired.items} emptyMessage={sections.actionRequired.emptyMessage} title={sections.actionRequired.title} />
      </div>
    </DashboardShell>
  );
}

function LoadingState({
  viewModel,
}: Readonly<{
  viewModel: BreederDashboardLoadingViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/breeder-dashboard"
      navigation={breederNavigation}
      organizationName={viewModel.title}
      roleLabel="Breeder"
    >
      <UiLoadingState message={viewModel.message} title={viewModel.title} />
    </DashboardShell>
  );
}

function ErrorState({
  viewModel,
}: Readonly<{
  viewModel: BreederDashboardErrorViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/breeder-dashboard"
      navigation={breederNavigation}
      roleLabel="Breeder"
    >
      <UiErrorState message={viewModel.message} title={viewModel.title} />
    </DashboardShell>
  );
}

function StatusSummary({
  items,
}: Readonly<{
  items: readonly BreederDashboardStatusSummaryItem[];
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
        <MetricCard label="No orders" value="0" meta="No order activity has been recorded." />
      )}
    </section>
  );
}

function ListingsSection({
  title,
  emptyMessage,
  items,
}: Readonly<{
  title: string;
  emptyMessage: string;
  items: readonly BreederDashboardListingCard[];
}>) {
  return (
    <DashboardSection title={title} headingId="active-listings-heading">
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
              <th>Order</th>
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
                  {listing.createOrderHref ? (
                    <ButtonLink href={listing.createOrderHref} variant="ghost">
                      Order
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
  items: readonly BreederDashboardOrderRow[];
}>) {
  return (
    <DashboardSection title={title} headingId="my-orders-heading">
      {items.length === 0 ? (
        <EmptyMessage message={emptyMessage} />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Station</th>
              <th>Latest movement</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {items.map((order) => {
              const latest = order.statusHistory[0];

              return (
                <tr key={order.id ?? order.orderNumber}>
                  <td>{order.orderNumber}</td>
                  <td><StatusBadge value={order.status} /></td>
                  <td>{order.breedingStationOrganizationId}</td>
                  <td>{latest ? `${formatStatus(latest.toStatus)} at ${latest.changedAt}` : "No status history"}</td>
                  <td>
                    <div className="ct-action-bar">
                      {order.detailHref ? (
                        <ButtonLink href={order.detailHref} variant="ghost">
                          Details
                        </ButtonLink>
                      ) : null}
                      {order.statusHistoryHref ? (
                        <ButtonLink href={order.statusHistoryHref} variant="ghost">
                          History
                        </ButtonLink>
                      ) : null}
                      {!order.detailHref && !order.statusHistoryHref ? <StatusBadge value="unavailable" /> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
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
  items: readonly BreederDashboardDocumentRow[];
}>) {
  return (
    <DashboardSection title={title} headingId="recent-documents-heading">
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

function ActionRequiredSection({
  title,
  emptyMessage,
  items,
}: Readonly<{
  title: string;
  emptyMessage: string;
  items: readonly BreederDashboardActionItem[];
}>) {
  return (
    <DashboardSection title={title} headingId="action-required-heading">
      {items.length === 0 ? (
        <EmptyMessage message={emptyMessage} />
      ) : (
        <div className="ct-card-grid">
          {items.map((item) => (
            <article className="ct-record-card" key={item.id}>
              <div className="ct-record-card__header">
                <h3>{item.title}</h3>
                <StatusBadge value={item.status} />
              </div>
              <span>{item.orderNumber}</span>
              <p>{item.description}</p>
              {item.actionHref ? (
                <ButtonLink href={item.actionHref} variant="secondary">
                  {item.actionLabel}
                </ButtonLink>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </DashboardSection>
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

function EmptyMessage({ message }: Readonly<{ message: string }>) {
  return <EmptyState message={message} title="Nothing to show yet" />;
}

function formatStatus(value: unknown) {
  return formatStatusLabel(value);
}

function isImplementedDocumentHref(href: string | null) {
  return Boolean(href);
}
