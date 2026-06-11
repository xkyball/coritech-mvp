import {
  Badge,
  ButtonLink,
  Card,
  DashboardShell,
  Notice,
  PageHeader,
  SectionHeader,
  StatusBadge,
  Table,
} from "../../../../components/ui";
import {
  createAdminIdentityViewModel,
  formatLabel,
} from "../../../../features/admin-identity/admin-identity-management.mjs";
import { createPrismaAdminIdentityRepository } from "../../../../features/admin-identity/prisma-admin-identity-repository";
import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import { adminNavigation } from "../../../../features/navigation";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
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

  return (
    <DashboardShell
      activeHref="/app/admin/roles"
      navigation={adminNavigation}
      organizationName={activeContext.organizationName}
      roleLabel="Platform Admin"
    >
      <div className="ct-page-stack">
        <PageHeader
          eyebrow="Platform admin"
          subtitle="Review active Phase 1 roles and prepared future roles without enabling future access."
          title="Roles"
        />
        <Notice
          action={(
            <ButtonLink href="/app/admin/users" variant="secondary">
              Assign user role
            </ButtonLink>
          )}
          title="Role assignment"
          tone="info"
        >
          Role changes are created from the users page and audit logged through
          the role-assignment service.
        </Notice>
        <Card aria-labelledby="roles-table-heading">
          <SectionHeader
            count={`${viewModel.roles.length} roles`}
            id="roles-table-heading"
            title="Role catalogue"
          />
          <Table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Phase</th>
                <th>Assignable</th>
                <th>Active assignments</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {viewModel.roles.map((role) => (
                <tr key={role.code}>
                  <td>{role.displayLabel}</td>
                  <td><Badge tone={role.isAssignableInPhase1 ? "success" : "warning"}>{formatLabel(role.phase)}</Badge></td>
                  <td>
                    <StatusBadge
                      label={role.isAssignableInPhase1 ? "Phase 1" : "Future"}
                      value={role.isAssignableInPhase1 ? "active" : "pending"}
                    />
                  </td>
                  <td>{role.assignmentCount}</td>
                  <td>{role.description}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </DashboardShell>
  );
}
