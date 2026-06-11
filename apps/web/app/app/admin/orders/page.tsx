import { SEMEN_ORDER_STATUSES } from "@coritech/domain/orders/semen-order.mjs";

import {
  Button,
  ButtonLink,
  Card,
  DashboardShell,
  EmptyState,
  Field,
  Input,
  PageHeader,
  PaginationControls,
  SearchField,
  SectionHeader,
  Select,
  StatusBadge,
  Table,
} from "../../../../components/ui";
import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import {
  createAdminOrderSupportSearchViewModel,
  normalizeSearchFilters,
} from "../../../../features/admin-order-support/admin-order-support.mjs";
import { createPrismaSemenOrderRepository } from "../../../../features/order-creation/prisma-semen-order-repository";
import { adminNavigation } from "../../../../features/navigation";

type AdminOrdersSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export default async function AdminOrderSupportPage({
  searchParams,
}: Readonly<{
  searchParams?: AdminOrdersSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const repository = createPrismaSemenOrderRepository();
  const orders = await repository.listSemenOrders({});
  const organizations = await repository.listOrganizationsByIds(
    orders.flatMap((order) => [
      order.breederOrganizationId,
      order.breedingStationOrganizationId,
    ]),
  );
  const filters = normalizeSearchFilters({
    page: firstSearchParam(resolvedSearchParams?.page),
    pageSize: firstSearchParam(resolvedSearchParams?.pageSize),
    query: firstSearchParam(resolvedSearchParams?.query),
    direction: firstSearchParam(resolvedSearchParams?.direction),
    sort: firstSearchParam(resolvedSearchParams?.sort),
    ...parseSortDirection(firstSearchParam(resolvedSearchParams?.sortDirection)),
    status: firstSearchParam(resolvedSearchParams?.status),
  });
  const viewModel = createAdminOrderSupportSearchViewModel({
    actor: activeContext,
    filters,
    orders,
    organizations,
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
          eyebrow="Platform admin"
          subtitle="Search and inspect order context without directly editing proof-critical records."
          title="Order support"
        />
        <Card aria-labelledby="admin-order-search-heading">
          <SectionHeader
            count={`${viewModel.pagination.totalItems} orders`}
            id="admin-order-search-heading"
            title="Order search"
          />
          <form action="/app/admin/orders" className="ct-form-grid ct-form-grid--filters" method="get">
            <SearchField
              defaultValue={viewModel.filters.query}
              id="admin-order-query"
              placeholder="Order, breeder or station"
            />
            <Field htmlFor="admin-order-status" label="Status">
              <Select
                defaultValue={viewModel.filters.status}
                id="admin-order-status"
                name="status"
              >
                <option value="">All statuses</option>
                {SEMEN_ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="admin-order-sort" label="Sort">
              <Select
                defaultValue={`${viewModel.filters.sort}:${viewModel.filters.direction}`}
                id="admin-order-sort"
                name="sortDirection"
              >
                <option value="updatedAt:desc">Updated newest</option>
                <option value="updatedAt:asc">Updated oldest</option>
                <option value="orderNumber:asc">Order number A-Z</option>
                <option value="orderNumber:desc">Order number Z-A</option>
                <option value="status:asc">Status A-Z</option>
              </Select>
            </Field>
            <Field htmlFor="admin-order-page-size" label="Page size">
              <Input
                defaultValue={String(viewModel.filters.pageSize)}
                id="admin-order-page-size"
                max={100}
                min={1}
                name="pageSize"
                type="number"
              />
            </Field>
            <div className="ct-form-actions">
              <Button type="submit">Filter</Button>
              <ButtonLink href="/app/admin/orders" variant="secondary">
                Reset
              </ButtonLink>
            </div>
          </form>
        </Card>
        <Card aria-labelledby="admin-order-results-heading">
          <SectionHeader
            count={`Page ${viewModel.pagination.page} of ${viewModel.pagination.totalPages}`}
            id="admin-order-results-heading"
            title="Search results"
          />
          {viewModel.rows.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Breeder</th>
                  <th>Station</th>
                  <th>Updated</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {viewModel.rows.map((order) => (
                  <tr key={order.id ?? order.orderNumber}>
                    <td>{order.orderNumber}</td>
                    <td><StatusBadge kind="order" value={order.status} /></td>
                    <td>{order.breederOrganizationName}</td>
                    <td>{order.breedingStationOrganizationName}</td>
                    <td>{order.updatedAt}</td>
                    <td>
                      <ButtonLink href={order.detailHref} variant="secondary">
                        Inspect
                      </ButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState message="No orders matched the current search and filters." />
          )}
          <PaginationControls
            firstHref={viewModel.pagination.firstHref}
            hasNextPage={viewModel.pagination.hasNextPage}
            hasPreviousPage={viewModel.pagination.hasPreviousPage}
            label={`Page ${viewModel.pagination.page} of ${viewModel.pagination.totalPages}`}
            nextHref={viewModel.pagination.nextHref}
            previousHref={viewModel.pagination.previousHref}
          />
        </Card>
      </div>
    </DashboardShell>
  );
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseSortDirection(value: string | undefined) {
  if (!value) {
    return {};
  }

  const [sort, direction] = value.split(":");

  return {
    direction,
    sort,
  };
}
