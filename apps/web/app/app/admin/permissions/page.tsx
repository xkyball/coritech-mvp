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
} from "../../../../components/ui";
import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import { adminNavigation } from "../../../../features/navigation";
import { PermissionRevokeDialog } from "../../../../features/permission-management/PermissionRevokeDialog";
import {
  buildPermissionManagementHref,
  createPermissionManagementViewModel,
  formatPermissionLabel,
  grantManagedAccessPermission,
  normalizePermissionFilters,
  revokeManagedAccessPermission,
} from "../../../../features/permission-management/permission-management.mjs";
import { createPrismaAccessPermissionRepository } from "../../../../features/permission-management/prisma-access-permission-repository";

type PermissionSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export default async function PermissionManagementPage({
  searchParams,
}: Readonly<{
  searchParams?: PermissionSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const filters = normalizePermissionFilters({
    objectType: firstSearchParam(resolvedSearchParams?.objectType),
    objectId: firstSearchParam(resolvedSearchParams?.objectId),
    userId: firstSearchParam(resolvedSearchParams?.userId),
    organizationId: firstSearchParam(resolvedSearchParams?.organizationId),
    scope: firstSearchParam(resolvedSearchParams?.scope),
    status: firstSearchParam(resolvedSearchParams?.status),
    page: firstSearchParam(resolvedSearchParams?.page),
    pageSize: firstSearchParam(resolvedSearchParams?.pageSize),
  });
  const repository = createPrismaAccessPermissionRepository();
  const [permissions, users, organizations] = await Promise.all([
    repository.listAccessPermissions(filters),
    repository.listUsers(),
    repository.listOrganizations(),
  ]);
  const viewModel = createPermissionManagementViewModel({
    actor: activeContext,
    permissions,
    users,
    organizations,
    filters,
  });
  const status = firstSearchParam(resolvedSearchParams?.statusMessage);
  const error = firstSearchParam(resolvedSearchParams?.error);

  return (
    <DashboardShell
      activeHref="/app/admin/permissions"
      navigation={adminNavigation}
      organizationName={activeContext.organizationName}
      roleLabel="Platform Admin"
    >
      <div className="ct-page-stack">
        <PageHeader
          eyebrow="Platform admin"
          subtitle="Grant and revoke explicit object-level permissions without creating unrestricted buyer, marketplace or database access."
          title="Permission management"
        />
        {status ? (
          <Notice title="Permission change recorded" tone="success">
            {status === "revoked"
              ? "The permission was revoked and audit logged."
              : "The permission was granted and audit logged."}
          </Notice>
        ) : null}
        {error ? (
          <Notice title="Permission change was not saved" tone="danger">
            {error}
          </Notice>
        ) : null}
        <Notice title="Controlled access only" tone="info">
          Grants are limited to named Phase 1 objects and active scopes. Buyer
          view remains a prepared future scope and is not available here.
        </Notice>
        <Card aria-labelledby="permission-grant-heading">
          <SectionHeader
            id="permission-grant-heading"
            subtitle="Create user or organization scoped grants with an optional expiry."
            title="Grant permission"
          />
          <form action={grantPermissionAction} className="ct-form-grid" method="post">
            <Field htmlFor="permission-subject-type" label="Subject type">
              <Select id="permission-subject-type" name="subjectType" required>
                <option value="user">User</option>
                <option value="organization">Organization</option>
              </Select>
            </Field>
            <Field htmlFor="permission-user-id" label="User">
              <Select id="permission-user-id" name="userId">
                <option value="">No user selected</option>
                {viewModel.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} ({user.email})
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="permission-organization-id" label="Organization">
              <Select id="permission-organization-id" name="organizationId">
                <option value="">No organization selected</option>
                {viewModel.organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="permission-object-type" label="Object type">
              <Select id="permission-object-type" name="objectType" required>
                {viewModel.objectTypeOptions.map((objectType) => (
                  <option key={objectType} value={objectType}>
                    {objectType}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="permission-object-id" label="Object ID">
              <Input id="permission-object-id" name="objectId" placeholder="UUID" required />
            </Field>
            <Field htmlFor="permission-scope" label="Scope">
              <Select id="permission-scope" name="scope" required>
                {viewModel.scopeOptions.map((scope) => (
                  <option key={scope} value={scope}>
                    {formatPermissionLabel(scope)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="permission-expires-at" label="Expires at">
              <Input id="permission-expires-at" name="expiresAt" type="datetime-local" />
            </Field>
            <Field className="ct-field--wide" htmlFor="permission-grant-reason" label="Grant reason">
              <Textarea id="permission-grant-reason" name="grantReason" rows={3} />
            </Field>
            <div className="ct-form-actions">
              <Button type="submit">Grant permission</Button>
            </div>
          </form>
        </Card>
        <Card aria-labelledby="permission-filter-heading">
          <SectionHeader
            count={`${viewModel.pagination.totalItems} permissions`}
            id="permission-filter-heading"
            title="Permission list"
          />
          <form action="/app/admin/permissions" className="ct-form-grid ct-form-grid--filters" method="get">
            <Field htmlFor="permission-filter-object-type" label="Object type">
              <Select
                defaultValue={viewModel.filters.objectType}
                id="permission-filter-object-type"
                name="objectType"
              >
                <option value="">All object types</option>
                {viewModel.objectTypeOptions.map((objectType) => (
                  <option key={objectType} value={objectType}>
                    {objectType}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="permission-filter-object-id" label="Object ID">
              <Input
                defaultValue={viewModel.filters.objectId}
                id="permission-filter-object-id"
                name="objectId"
              />
            </Field>
            <Field htmlFor="permission-filter-user-id" label="User">
              <Select
                defaultValue={viewModel.filters.userId}
                id="permission-filter-user-id"
                name="userId"
              >
                <option value="">All users</option>
                {viewModel.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} ({user.email})
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="permission-filter-organization-id" label="Organization">
              <Select
                defaultValue={viewModel.filters.organizationId}
                id="permission-filter-organization-id"
                name="organizationId"
              >
                <option value="">All organizations</option>
                {viewModel.organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="permission-filter-scope" label="Scope">
              <Select
                defaultValue={viewModel.filters.scope}
                id="permission-filter-scope"
                name="scope"
              >
                <option value="">All scopes</option>
                {viewModel.scopeOptions.map((scope) => (
                  <option key={scope} value={scope}>
                    {formatPermissionLabel(scope)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="permission-filter-status" label="Status">
              <Select
                defaultValue={viewModel.filters.status}
                id="permission-filter-status"
                name="status"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </Select>
            </Field>
            <Field htmlFor="permission-filter-page-size" label="Page size">
              <Input
                defaultValue={String(viewModel.filters.pageSize)}
                id="permission-filter-page-size"
                max={100}
                min={1}
                name="pageSize"
                type="number"
              />
            </Field>
            <input name="page" type="hidden" value="1" />
            <div className="ct-form-actions">
              <Button type="submit">Filter</Button>
              <ButtonLink href="/app/admin/permissions" variant="secondary">
                Reset
              </ButtonLink>
            </div>
          </form>
          <Table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Object</th>
                <th>Scope</th>
                <th>Status</th>
                <th>Expiry</th>
                <th>Audit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {viewModel.rows.map((permission) => (
                <tr key={permission.id ?? `${permission.subjectLabel}:${permission.objectLabel}`}>
                  <td>
                    <strong>{permission.subjectLabel}</strong>
                    <span>{permission.subjectType}</span>
                  </td>
                  <td>{permission.objectLabel}</td>
                  <td>{permission.scopeLabel}</td>
                  <td><StatusBadge label={permission.statusLabel} value={permission.status} /></td>
                  <td>{permission.expiresAt}</td>
                  <td>
                    <ButtonLink href={permission.auditHref} variant="secondary">
                      Audit
                    </ButtonLink>
                  </td>
                  <td>
                    {permission.canRevoke && permission.id ? (
                      <PermissionRevokeDialog
                        permissionId={permission.id}
                        revokeAction={revokePermissionAction}
                      />
                    ) : (
                      <span>Closed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
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
              href={buildPermissionManagementHref(viewModel.filters, { page: 1 })}
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

async function grantPermissionAction(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const repository = createPrismaAccessPermissionRepository();

  try {
    await grantManagedAccessPermission({
      actor: activeContext,
      repository,
      subjectType: stringFormValue(formData, "subjectType"),
      userId: stringFormValue(formData, "userId"),
      organizationId: stringFormValue(formData, "organizationId"),
      objectType: stringFormValue(formData, "objectType"),
      objectId: stringFormValue(formData, "objectId"),
      scope: stringFormValue(formData, "scope"),
      expiresAt: stringFormValue(formData, "expiresAt"),
      grantReason: stringFormValue(formData, "grantReason"),
    });
  } catch (error) {
    redirectWithIssue(error);
  }

  redirect("/app/admin/permissions?statusMessage=granted");
}

async function revokePermissionAction(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const repository = createPrismaAccessPermissionRepository();

  try {
    await revokeManagedAccessPermission({
      actor: activeContext,
      repository,
      permissionId: stringFormValue(formData, "permissionId"),
      revocationReason: stringFormValue(formData, "revocationReason"),
    });
  } catch (error) {
    redirectWithIssue(error);
  }

  redirect("/app/admin/permissions?statusMessage=revoked");
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function stringFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function redirectWithIssue(error: unknown): never {
  const message = error instanceof Error ? error.message : "Permission change failed.";
  redirect(`/app/admin/permissions?error=${encodeURIComponent(message)}`);
}
