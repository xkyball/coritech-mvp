import {
  Button,
  ButtonLink,
  Card,
  DashboardShell,
  EmptyState,
  Field,
  PageHeader,
  SectionHeader,
  Select,
  StatusBadge,
  Table,
} from "../../../../components/ui";
import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import { adminNavigation } from "../../../../features/navigation";
import { createPrismaSupportRequestRepository } from "../../../../features/support-requests/prisma-support-request-repository";
import {
  createAdminSupportQueueViewModel,
} from "../../../../features/support-requests/view-model";

type AdminSupportSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export default async function AdminSupportQueuePage({
  searchParams,
}: Readonly<{
  searchParams?: AdminSupportSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const status = firstSearchParam(resolvedSearchParams?.status);
  const category = firstSearchParam(resolvedSearchParams?.category);
  const repository = createPrismaSupportRequestRepository();
  const supportRequests = await repository.listSupportRequests({
    category,
    status,
  });
  const viewModel = createAdminSupportQueueViewModel({
    actor: activeContext,
    filters: {
      category,
      status,
    },
    supportRequests,
  });

  return (
    <DashboardShell
      activeHref="/app/admin/support"
      navigation={adminNavigation}
      organizationName={activeContext.organizationName}
      roleLabel="Platform Admin"
    >
      <div className="ct-page-stack">
        <PageHeader
          eyebrow="Platform admin"
          subtitle="Review order-linked user support requests queued for admin action."
          title={viewModel.title}
        />
        <Card aria-labelledby="admin-support-filters-heading">
          <SectionHeader
            id="admin-support-filters-heading"
            title="Filters"
          />
          <form action="/app/admin/support" className="ct-form-grid ct-form-grid--filters" method="get">
            <Field htmlFor="admin-support-status" label="Status">
              <Select
                defaultValue={viewModel.filters.status}
                id="admin-support-status"
                name="status"
              >
                <option value="">All statuses</option>
                {viewModel.statuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="admin-support-category" label="Category">
              <Select
                defaultValue={viewModel.filters.category}
                id="admin-support-category"
                name="category"
              >
                <option value="">All categories</option>
                {viewModel.categories.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="ct-form-actions">
              <Button type="submit">Filter</Button>
              <ButtonLink href="/app/admin/support" variant="secondary">
                Reset
              </ButtonLink>
            </div>
          </form>
        </Card>
        <Card aria-labelledby="admin-support-queue-heading">
          <SectionHeader
            count={`${viewModel.rows.length} requests`}
            id="admin-support-queue-heading"
            title="Support queue"
          />
          {viewModel.rows.length === 0 ? (
            <EmptyState message={viewModel.emptyMessage} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Requester</th>
                  <th>Message</th>
                  <th>Queued</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {viewModel.rows.map((row) => (
                  <tr key={row.id ?? `${row.objectId}:${row.createdAt}`}>
                    <td>{row.orderNumber}</td>
                    <td>{row.categoryLabel}</td>
                    <td><StatusBadge label={row.statusLabel} value={row.status} /></td>
                    <td>{row.createdByRole} / {row.createdByOrganizationId}</td>
                    <td>{row.message}</td>
                    <td>{row.adminNotificationStatus}</td>
                    <td>
                      <ButtonLink href={row.detailHref} variant="secondary">
                        Order
                      </ButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
