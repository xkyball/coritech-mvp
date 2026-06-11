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
} from "../../../../components/ui";
import {
  createAdminIdentityViewModel,
  createOrganizationForAdmin,
  disableOrganizationForAdmin,
  formatLabel,
  updateOrganizationForAdmin,
} from "../../../../features/admin-identity/admin-identity-management.mjs";
import { createPrismaAdminIdentityRepository } from "../../../../features/admin-identity/prisma-admin-identity-repository";
import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import { adminNavigation } from "../../../../features/navigation";

type AdminOrganizationsSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export default async function AdminOrganizationsPage({
  searchParams,
}: Readonly<{
  searchParams?: AdminOrganizationsSearchParams;
}>) {
  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const repository = createPrismaAdminIdentityRepository();
  const [users, organizations, roles, assignments] = await Promise.all([
    repository.listUsers(),
    repository.listOrganizations(),
    repository.listRoles(),
    repository.listUserOrganizationRoles(),
  ]);
  const viewModel = createAdminIdentityViewModel({
    actor: activeContext,
    users,
    organizations,
    roles,
    assignments,
  });
  const resolvedSearchParams = await searchParams;
  const status = firstSearchParam(resolvedSearchParams?.statusMessage);
  const error = firstSearchParam(resolvedSearchParams?.error);

  return (
    <DashboardShell
      activeHref="/app/admin/organizations"
      navigation={adminNavigation}
      organizationName={activeContext.organizationName}
      roleLabel="Platform Admin"
    >
      <div className="ct-page-stack">
        <PageHeader
          eyebrow="Platform admin"
          subtitle="Create, edit and disable organizations while preserving organization history."
          title="Organizations"
        />
        {status ? (
          <Notice title="Organization change recorded" tone="success">
            {status === "disabled"
              ? "The organization was disabled and audit logged."
              : "The organization was saved and audit logged."}
          </Notice>
        ) : null}
        {error ? (
          <Notice title="Organization change was not saved" tone="danger">
            {error}
          </Notice>
        ) : null}
        <Notice title="No silent deletion" tone="info">
          {viewModel.mutationPolicy.reason}
        </Notice>
        <Card aria-labelledby="create-organization-heading">
          <SectionHeader id="create-organization-heading" title="Create organization" />
          <form action={createOrganizationAction} className="ct-form-grid" method="post">
            <Field htmlFor="organization-name" label="Name">
              <Input id="organization-name" name="name" required />
            </Field>
            <Field htmlFor="organization-type" label="Type">
              <Select id="organization-type" name="organizationType" required>
                {viewModel.organizationTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatLabel(type)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field className="ct-field--wide" htmlFor="organization-reason" label="Reason">
              <Textarea id="organization-reason" name="reason" rows={3} />
            </Field>
            <div className="ct-form-actions">
              <Button type="submit">Create organization</Button>
            </div>
          </form>
        </Card>
        <Card aria-labelledby="organizations-table-heading">
          <SectionHeader
            count={`${viewModel.organizations.length} organizations`}
            id="organizations-table-heading"
            title="Organization list"
          />
          <Table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Type</th>
                <th>Status</th>
                <th>Active roles</th>
                <th>Edit</th>
                <th>Disable</th>
              </tr>
            </thead>
            <tbody>
              {viewModel.organizations.map((organization) => (
                <tr key={organization.id}>
                  <td>{organization.name}</td>
                  <td>{formatLabel(organization.organizationType)}</td>
                  <td><StatusBadge label={formatLabel(organization.status)} value={organization.status} /></td>
                  <td>{organization.activeRoleCount}</td>
                  <td>
                    <form action={updateOrganizationAction} className="ct-table-action-form" method="post">
                      <input name="organizationId" type="hidden" value={organization.id} />
                      <Input
                        aria-label={`Name for ${organization.name}`}
                        defaultValue={organization.name}
                        name="name"
                        required
                      />
                      <Select
                        aria-label={`Type for ${organization.name}`}
                        defaultValue={organization.organizationType}
                        name="organizationType"
                      >
                        {viewModel.organizationTypes.map((type) => (
                          <option key={type} value={type}>
                            {formatLabel(type)}
                          </option>
                        ))}
                      </Select>
                      <Button type="submit" variant="secondary">
                        Save
                      </Button>
                    </form>
                  </td>
                  <td>
                    {organization.canDisable ? (
                      <form action={disableOrganizationAction} className="ct-table-action-form" method="post">
                        <input name="organizationId" type="hidden" value={organization.id} />
                        <Input
                          aria-label={`Disable reason for ${organization.name}`}
                          name="reason"
                          placeholder="Reason"
                          required
                        />
                        <Button type="submit" variant="danger">
                          Disable
                        </Button>
                      </form>
                    ) : (
                      <span>Disabled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="ct-form-actions">
            <ButtonLink href="/app/admin/users" variant="secondary">
              Manage user roles
            </ButtonLink>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

async function createOrganizationAction(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const repository = createPrismaAdminIdentityRepository();

  try {
    await createOrganizationForAdmin({
      actor: activeContext,
      repository,
      name: stringFormValue(formData, "name"),
      organizationType: stringFormValue(formData, "organizationType"),
      reason: stringFormValue(formData, "reason"),
      requestContext: {
        userAgent: (await headers()).get("user-agent"),
      },
    });
  } catch (error) {
    redirectWithIssue(error, "/app/admin/organizations");
  }

  redirect("/app/admin/organizations?statusMessage=saved");
}

async function updateOrganizationAction(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const repository = createPrismaAdminIdentityRepository();

  try {
    await updateOrganizationForAdmin({
      actor: activeContext,
      repository,
      organizationId: stringFormValue(formData, "organizationId"),
      name: stringFormValue(formData, "name"),
      organizationType: stringFormValue(formData, "organizationType"),
      reason: "Platform Admin updated organization details.",
      requestContext: {
        userAgent: (await headers()).get("user-agent"),
      },
    });
  } catch (error) {
    redirectWithIssue(error, "/app/admin/organizations");
  }

  redirect("/app/admin/organizations?statusMessage=saved");
}

async function disableOrganizationAction(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const repository = createPrismaAdminIdentityRepository();

  try {
    await disableOrganizationForAdmin({
      actor: activeContext,
      repository,
      organizationId: stringFormValue(formData, "organizationId"),
      reason: stringFormValue(formData, "reason"),
      requestContext: {
        userAgent: (await headers()).get("user-agent"),
      },
    });
  } catch (error) {
    redirectWithIssue(error, "/app/admin/organizations");
  }

  redirect("/app/admin/organizations?statusMessage=disabled");
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function stringFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function redirectWithIssue(error: unknown, route: string): never {
  const message = error instanceof Error ? error.message : "Identity change failed.";
  redirect(`${route}?error=${encodeURIComponent(message)}`);
}
