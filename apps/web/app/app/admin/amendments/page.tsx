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
  StatusBadge,
  Table,
} from "../../../../components/ui";
import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import {
  createAdminAmendmentViewModel,
  formatAmendmentLabel,
} from "../../../../features/admin-amendments/admin-amendments.mjs";
import { createPrismaAmendmentRepository } from "../../../../features/admin-amendments/prisma-amendment-repository";
import { adminNavigation } from "../../../../features/navigation";

type AdminAmendmentsSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export default async function AdminAmendmentsPage({
  searchParams,
}: Readonly<{
  searchParams?: AdminAmendmentsSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const repository = createPrismaAmendmentRepository();
  const filters = {
    targetType: firstSearchParam(resolvedSearchParams?.targetType),
    targetId: firstSearchParam(resolvedSearchParams?.targetId),
    limit: 100,
  };
  const amendments = await repository.listAmendments(filters);
  const viewModel = createAdminAmendmentViewModel({
    actor: activeContext,
    amendments,
    defaults: filters,
  });
  const status = firstSearchParam(resolvedSearchParams?.statusMessage);

  return (
    <DashboardShell
      activeHref="/app/admin/amendments"
      navigation={adminNavigation}
      organizationName={activeContext.organizationName}
      roleLabel="Platform Admin"
    >
      <div className="ct-page-stack">
        <PageHeader
          actions={(
            <ButtonLink href="/app/admin/amendments/new" variant="primary">
              New amendment
            </ButtonLink>
          )}
          eyebrow="Platform admin"
          subtitle="Review correction records that preserve original and amended values with mandatory reason and audit evidence."
          title="Amendments"
        />
        {status === "created" ? (
          <Notice title="Amendment recorded" tone="success">
            The correction was captured with its original value and audit trail.
          </Notice>
        ) : null}
        <Notice title="Proof-critical records stay immutable" tone="warning">
          The amendment workflow records correction evidence. It does not silently
          overwrite the selected target record.
        </Notice>
        <Card aria-labelledby="admin-amendments-filter-heading">
          <SectionHeader
            count={`${viewModel.rows.length} amendments`}
            id="admin-amendments-filter-heading"
            title="Amendment query"
          />
          <form action="/app/admin/amendments" className="ct-form-grid ct-form-grid--filters" method="get">
            <Field htmlFor="amendment-filter-target-type" label="Target type">
              <Select
                defaultValue={viewModel.defaults.targetType}
                id="amendment-filter-target-type"
                name="targetType"
              >
                <option value="">All target types</option>
                {viewModel.targetTypes.map((targetType) => (
                  <option key={targetType} value={targetType}>
                    {formatAmendmentLabel(targetType)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="amendment-filter-target-id" label="Target ID">
              <Input
                defaultValue={viewModel.defaults.targetId}
                id="amendment-filter-target-id"
                name="targetId"
                placeholder="UUID"
              />
            </Field>
            <div className="ct-form-actions">
              <Button type="submit">Filter</Button>
              <ButtonLink href="/app/admin/amendments" variant="secondary">
                Reset
              </ButtonLink>
            </div>
          </form>
        </Card>
        <Card aria-labelledby="admin-amendments-table-heading">
          <SectionHeader
            count={`${viewModel.rows.length} records`}
            id="admin-amendments-table-heading"
            title="Recorded corrections"
          />
          <Table>
            <thead>
              <tr>
                <th>Target</th>
                <th>Field</th>
                <th>Status</th>
                <th>Original value</th>
                <th>Amended value</th>
                <th>Reason</th>
                <th>Audit</th>
              </tr>
            </thead>
            <tbody>
              {viewModel.rows.length > 0 ? (
                viewModel.rows.map((amendment) => (
                  <tr key={amendment.id ?? `${amendment.targetId}:${amendment.occurredAt}`}>
                    <td>
                      <strong>{formatAmendmentLabel(amendment.targetType)}</strong>
                      <span>{amendment.orderNumber || amendment.targetId}</span>
                    </td>
                    <td>{amendment.targetField}</td>
                    <td><StatusBadge value={amendment.status} /></td>
                    <td>{amendment.originalValuePreview}</td>
                    <td>{amendment.amendedValuePreview}</td>
                    <td>{amendment.reason}</td>
                    <td>
                      <ButtonLink href={amendment.auditHref} variant="secondary">
                        Audit
                      </ButtonLink>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>No amendments match this query.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      </div>
    </DashboardShell>
  );
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
