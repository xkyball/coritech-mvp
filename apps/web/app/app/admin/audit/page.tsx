import {
  listAuditLogsForAdmin,
} from "@coritech/domain/audit/audit-log.mjs";

import {
  Button,
  ButtonLink,
  Card,
  DashboardShell,
  Field,
  Input,
  Notice,
  PageHeader,
  SectionHeader,
  Select,
} from "../../../../components/ui";
import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import {
  createAuditLogViewerViewModel,
  AUDIT_LOG_ACTION_FILTER_OPTIONS,
  buildAuditLogViewerHref,
  formatAuditLabel,
  normalizeAuditLogFilters,
} from "../../../../features/audit-logs/audit-log-viewer.mjs";
import { AuditLogTable } from "../../../../features/audit-logs/AuditLogTable";
import { createPrismaAuditLogRepository } from "../../../../features/audit-logs/prisma-audit-log-repository";
import { adminNavigation } from "../../../../features/navigation";

type AdminAuditSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export default async function AdminAuditLogPage({
  searchParams,
}: Readonly<{
  searchParams?: AdminAuditSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const filters = normalizeAuditLogFilters({
    action: firstSearchParam(resolvedSearchParams?.action),
    actorOrganizationId: firstSearchParam(resolvedSearchParams?.actorOrganizationId),
    actorUserId: firstSearchParam(resolvedSearchParams?.actorUserId),
    fromOccurredAt: firstSearchParam(resolvedSearchParams?.fromOccurredAt),
    limit: firstSearchParam(resolvedSearchParams?.limit),
    objectId: firstSearchParam(resolvedSearchParams?.objectId),
    objectType: firstSearchParam(resolvedSearchParams?.objectType),
    page: firstSearchParam(resolvedSearchParams?.page),
    toOccurredAt: firstSearchParam(resolvedSearchParams?.toOccurredAt),
  });
  const auditLogs = await listAuditLogsForAdmin({
    actor: activeContext,
    repository: createPrismaAuditLogRepository(),
    filters,
  });
  const viewModel = createAuditLogViewerViewModel({
    auditLogs,
    filters,
  });

  return (
    <DashboardShell
      activeHref="/app/admin/audit"
      navigation={adminNavigation}
      organizationName={activeContext.organizationName}
      roleLabel="Platform Admin"
    >
      <div className="ct-page-stack">
        <PageHeader
          eyebrow="Platform admin"
          subtitle="Review immutable audit entries for sensitive views, permission changes, admin access and denied protected-object attempts."
          title="Audit logs"
        />
        <Notice title="Read-only audit evidence" tone="info">
          Audit entries cannot be edited or deleted from the viewer. Corrections
          must be recorded as later audit, proof or amendment evidence.
        </Notice>
        <Card aria-labelledby="admin-audit-filter-heading">
          <SectionHeader
            count={`${viewModel.summary.totalCount} logs`}
            id="admin-audit-filter-heading"
            subtitle={`${viewModel.summary.accessDecisionCount} access decisions, ${viewModel.summary.deniedDecisionCount} denied attempts`}
            title="Audit query"
          />
          <form action="/app/admin/audit" className="ct-form-grid ct-form-grid--filters" method="get">
            <Field htmlFor="audit-object-type" label="Object type">
              <Input
                defaultValue={filters.objectType ?? ""}
                id="audit-object-type"
                name="objectType"
                placeholder="SemenOrder"
              />
            </Field>
            <Field htmlFor="audit-object-id" label="Object ID">
              <Input
                defaultValue={filters.objectId ?? ""}
                id="audit-object-id"
                name="objectId"
                placeholder="UUID"
              />
            </Field>
            <Field htmlFor="audit-action" label="Action">
              <Select defaultValue={filters.action ?? ""} id="audit-action" name="action">
                {AUDIT_LOG_ACTION_FILTER_OPTIONS.map((action) => (
                  <option key={action || "all"} value={action}>
                    {action ? formatAuditLabel(action) : "All actions"}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="audit-actor-user-id" label="Actor user">
              <Input
                defaultValue={filters.actorUserId ?? ""}
                id="audit-actor-user-id"
                name="actorUserId"
                placeholder="UUID"
              />
            </Field>
            <Field htmlFor="audit-actor-organization-id" label="Actor organization">
              <Input
                defaultValue={filters.actorOrganizationId ?? ""}
                id="audit-actor-organization-id"
                name="actorOrganizationId"
                placeholder="UUID"
              />
            </Field>
            <Field htmlFor="audit-from" label="From">
              <Input
                defaultValue={String(filters.fromOccurredAt ?? "")}
                id="audit-from"
                name="fromOccurredAt"
                type="datetime-local"
              />
            </Field>
            <Field htmlFor="audit-to" label="To">
              <Input
                defaultValue={String(filters.toOccurredAt ?? "")}
                id="audit-to"
                name="toOccurredAt"
                type="datetime-local"
              />
            </Field>
            <Field htmlFor="audit-limit" label="Limit">
              <Input
                defaultValue={String(filters.limit ?? 50)}
                id="audit-limit"
                max={200}
                min={1}
                name="limit"
                type="number"
              />
            </Field>
            <input name="page" type="hidden" value="1" />
            <div className="ct-form-actions">
              <Button type="submit">Filter</Button>
              <ButtonLink href="/app/admin/audit" variant="secondary">
                Reset
              </ButtonLink>
            </div>
          </form>
        </Card>
        <Card aria-labelledby="admin-audit-table-heading">
          <SectionHeader
            count={`Page ${viewModel.pagination.page}`}
            id="admin-audit-table-heading"
            title="Recent audit entries"
          />
          <AuditLogTable viewModel={viewModel} />
          <div className="ct-form-actions">
            <ButtonLink
              aria-disabled={!viewModel.pagination.hasPreviousPage}
              href={viewModel.pagination.previousHref}
              variant="secondary"
            >
              Previous
            </ButtonLink>
            <ButtonLink
              aria-disabled={!viewModel.pagination.hasNextPage}
              href={viewModel.pagination.nextHref}
              variant="secondary"
            >
              Next
            </ButtonLink>
            <ButtonLink
              href={buildAuditLogViewerHref(filters, { page: 1 })}
              variant="ghost"
            >
              First page
            </ButtonLink>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
