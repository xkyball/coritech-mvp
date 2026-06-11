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
import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import { adminNavigation } from "../../../../features/navigation";
import {
  assignRoleForAdmin,
  createAdminIdentityViewModel,
  disableUserForAdmin,
  formatLabel,
} from "../../../../features/admin-identity/admin-identity-management.mjs";
import { createPrismaAdminIdentityRepository } from "../../../../features/admin-identity/prisma-admin-identity-repository";

type AdminUsersSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: Readonly<{
  searchParams?: AdminUsersSearchParams;
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
      activeHref="/app/admin/users"
      navigation={adminNavigation}
      organizationName={activeContext.organizationName}
      roleLabel="Platform Admin"
    >
      <div className="ct-page-stack">
        <PageHeader
          eyebrow="Platform admin"
          subtitle="Manage existing user access, role assignments and disabled-user controls without deleting identity history."
          title="Users and roles"
        />
        {status ? (
          <Notice title="Identity change recorded" tone="success">
            {status === "disabled"
              ? "The user was disabled and audit logged."
              : "The role assignment was created and audit logged."}
          </Notice>
        ) : null}
        {error ? (
          <Notice title="Identity change was not saved" tone="danger">
            {error}
          </Notice>
        ) : null}
        <Notice title="Invitation workflow" tone="info">
          {viewModel.invitationBoundary.reason}
        </Notice>
        <Card aria-labelledby="role-assignment-heading">
          <SectionHeader
            id="role-assignment-heading"
            subtitle="Assign existing active users to active organizations with Phase 1 roles."
            title="Assign role"
          />
          <form action={assignRoleAction} className="ct-form-grid" method="post">
            <Field htmlFor="identity-user-id" label="User">
              <Select id="identity-user-id" name="userId" required>
                <option value="">Select user</option>
                {viewModel.users
                  .filter((user) => user.status === "ACTIVE")
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName} ({user.email})
                    </option>
                  ))}
              </Select>
            </Field>
            <Field htmlFor="identity-organization-id" label="Organization">
              <Select id="identity-organization-id" name="organizationId" required>
                <option value="">Select organization</option>
                {viewModel.organizations
                  .filter((organization) => organization.status === "ACTIVE")
                  .map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field htmlFor="identity-role-code" label="Role">
              <Select id="identity-role-code" name="roleCode" required>
                <option value="">Select role</option>
                {viewModel.assignableRoles.map((roleCode) => (
                  <option key={roleCode} value={roleCode}>
                    {formatLabel(roleCode)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field className="ct-field--wide" htmlFor="identity-role-reason" label="Assignment reason">
              <Textarea id="identity-role-reason" name="reason" rows={3} />
            </Field>
            <div className="ct-form-actions">
              <Button type="submit">Assign role</Button>
              <ButtonLink href="/app/admin/roles" variant="secondary">
                Review roles
              </ButtonLink>
            </div>
          </form>
        </Card>
        <Card aria-labelledby="users-table-heading">
          <SectionHeader
            count={`${viewModel.users.length} users`}
            id="users-table-heading"
            title="Users"
          />
          <Table>
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Active roles</th>
                <th>Disable</th>
              </tr>
            </thead>
            <tbody>
              {viewModel.users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.displayName}</strong>
                    <span>{user.email}</span>
                  </td>
                  <td><StatusBadge label={formatLabel(user.status)} value={user.status} /></td>
                  <td>
                    {user.activeRoles.length > 0
                      ? user.activeRoles.map((role) => (
                        <span key={role.id ?? `${role.organizationId}:${role.roleCode}`}>
                          {role.roleLabel} at {role.organizationName}
                        </span>
                      ))
                      : "No active roles"}
                  </td>
                  <td>
                    {user.canDisable ? (
                      <form action={disableUserAction} className="ct-table-action-form" method="post">
                        <input name="userId" type="hidden" value={user.id} />
                        <Input
                          aria-label={`Disable reason for ${user.displayName}`}
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
        </Card>
      </div>
    </DashboardShell>
  );
}

async function assignRoleAction(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const repository = createPrismaAdminIdentityRepository();

  try {
    await assignRoleForAdmin({
      actor: activeContext,
      repository,
      userId: stringFormValue(formData, "userId"),
      organizationId: stringFormValue(formData, "organizationId"),
      roleCode: stringFormValue(formData, "roleCode"),
      reason: stringFormValue(formData, "reason"),
      requestContext: {
        userAgent: (await headers()).get("user-agent"),
      },
    });
  } catch (error) {
    redirectWithIssue(error, "/app/admin/users");
  }

  redirect("/app/admin/users?statusMessage=role-assigned");
}

async function disableUserAction(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const repository = createPrismaAdminIdentityRepository();

  try {
    await disableUserForAdmin({
      actor: activeContext,
      repository,
      userId: stringFormValue(formData, "userId"),
      reason: stringFormValue(formData, "reason"),
      requestContext: {
        userAgent: (await headers()).get("user-agent"),
      },
    });
  } catch (error) {
    redirectWithIssue(error, "/app/admin/users");
  }

  redirect("/app/admin/users?statusMessage=disabled");
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
