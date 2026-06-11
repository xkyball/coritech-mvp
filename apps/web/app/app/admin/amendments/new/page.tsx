import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
  Textarea,
} from "../../../../../components/ui";
import { requireActiveContextActor } from "../../../../../features/auth/active-context-server";
import {
  createAdminAmendment,
  createAdminAmendmentViewModel,
  formatAmendmentLabel,
} from "../../../../../features/admin-amendments/admin-amendments.mjs";
import { createPrismaAmendmentRepository } from "../../../../../features/admin-amendments/prisma-amendment-repository";
import { adminNavigation } from "../../../../../features/navigation";

type AdminAmendmentNewSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export default async function AdminAmendmentNewPage({
  searchParams,
}: Readonly<{
  searchParams?: AdminAmendmentNewSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const defaults = {
    targetType: firstSearchParam(resolvedSearchParams?.targetType),
    targetId: firstSearchParam(resolvedSearchParams?.targetId),
    targetField: firstSearchParam(resolvedSearchParams?.targetField),
    orderNumber: firstSearchParam(resolvedSearchParams?.orderNumber),
  };
  const repository = createPrismaAmendmentRepository();
  const amendments = await repository.listAmendments({
    targetType: defaults.targetType,
    targetId: defaults.targetId,
    limit: 10,
  });
  const viewModel = createAdminAmendmentViewModel({
    actor: activeContext,
    amendments,
    defaults,
  });
  const error = firstSearchParam(resolvedSearchParams?.error);

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
            <ButtonLink href="/app/admin/amendments" variant="secondary">
              Amendment list
            </ButtonLink>
          )}
          eyebrow="Platform admin"
          subtitle="Create controlled correction evidence for a selected proof-relevant record."
          title="New amendment"
        />
        {error ? (
          <Notice title="Amendment was not saved" tone="danger">
            {error}
          </Notice>
        ) : null}
        <Notice title="Original value is read at submission" tone="info">
          The selected target record is loaded when the form is submitted. The
          captured original value remains visible beside the amended value.
        </Notice>
        <Notice title="No silent overwrite" tone="warning">
          This workflow creates an amendment record and audit log only. Target
          records are not directly edited from this screen.
        </Notice>
        <Card aria-labelledby="admin-amendment-create-heading">
          <SectionHeader
            id="admin-amendment-create-heading"
            subtitle="Select the record, field and amended value. A correction reason is required."
            title="Correction details"
          />
          <form action={createAmendmentAction} className="ct-form-grid" method="post">
            <Field htmlFor="amendment-target-type" label="Target type">
              <Select
                defaultValue={viewModel.defaults.targetType}
                id="amendment-target-type"
                name="targetType"
                required
              >
                <option value="">Select target type</option>
                {viewModel.targetTypes.map((targetType) => (
                  <option key={targetType} value={targetType}>
                    {formatAmendmentLabel(targetType)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="amendment-target-id" label="Target ID">
              <Input
                defaultValue={viewModel.defaults.targetId}
                id="amendment-target-id"
                name="targetId"
                placeholder="UUID"
                required
              />
            </Field>
            <Field
              hint="Leave blank to amend the whole target snapshot."
              htmlFor="amendment-target-field"
              label="Target field"
            >
              <Input
                defaultValue={viewModel.defaults.targetField}
                id="amendment-target-field"
                name="targetField"
                placeholder="status"
              />
            </Field>
            <Field className="ct-field--wide" htmlFor="amendment-value" label="Amended value">
              <Textarea
                id="amendment-value"
                name="amendedValue"
                placeholder='Corrected value or JSON, for example "CONFIRMED"'
                required
                rows={4}
              />
            </Field>
            <Field className="ct-field--wide" htmlFor="amendment-reason" label="Correction reason">
              <Textarea
                id="amendment-reason"
                name="reason"
                placeholder="Explain the correction source and why it is required."
                required
                rows={4}
              />
            </Field>
            <Input name="orderNumber" type="hidden" value={viewModel.defaults.orderNumber} />
            <div className="ct-form-actions">
              <Button type="submit">Record amendment</Button>
              <ButtonLink href="/app/admin/amendments" variant="secondary">
                Cancel
              </ButtonLink>
            </div>
          </form>
        </Card>
        <Card aria-labelledby="admin-amendment-recent-heading">
          <SectionHeader
            count={`${viewModel.rows.length} records`}
            id="admin-amendment-recent-heading"
            title="Recent related amendments"
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
                  <td colSpan={7}>No related amendments have been recorded.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      </div>
    </DashboardShell>
  );
}

async function createAmendmentAction(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const repository = createPrismaAmendmentRepository();

  try {
    await createAdminAmendment({
      actor: activeContext,
      repository,
      targetType: stringFormValue(formData, "targetType"),
      targetId: stringFormValue(formData, "targetId"),
      targetField: stringFormValue(formData, "targetField"),
      amendedValue: stringFormValue(formData, "amendedValue"),
      reason: stringFormValue(formData, "reason"),
      auditContext: {
        userAgent: (await headers()).get("user-agent"),
      },
    });
  } catch (error) {
    redirectWithIssue(error, formData);
  }

  const params = new URLSearchParams({
    statusMessage: "created",
    targetType: stringFormValue(formData, "targetType"),
    targetId: stringFormValue(formData, "targetId"),
  });

  redirect(`/app/admin/amendments?${params.toString()}`);
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function stringFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function redirectWithIssue(error: unknown, formData: FormData): never {
  const params = new URLSearchParams({
    error: error instanceof Error ? error.message : "Amendment change failed.",
    targetType: stringFormValue(formData, "targetType"),
    targetId: stringFormValue(formData, "targetId"),
    targetField: stringFormValue(formData, "targetField"),
    orderNumber: stringFormValue(formData, "orderNumber"),
  });

  redirect(`/app/admin/amendments/new?${params.toString()}`);
}
