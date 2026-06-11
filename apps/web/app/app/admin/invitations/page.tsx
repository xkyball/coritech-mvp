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
} from "../../../../components/ui";
import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import { adminNavigation } from "../../../../features/navigation";
import {
  createManagedUserInvitation,
  createUserInvitationAdminViewModel,
  formatInvitationLabel,
  normalizeInvitationFilters,
} from "../../../../features/user-invitations/user-invitations.mjs";
import { createPrismaUserInvitationRepository } from "../../../../features/user-invitations/prisma-user-invitation-repository";

type AdminInvitationsSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export default async function AdminInvitationsPage({
  searchParams,
}: Readonly<{
  searchParams?: AdminInvitationsSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const filters = normalizeInvitationFilters({
    status: firstSearchParam(resolvedSearchParams?.status),
    email: firstSearchParam(resolvedSearchParams?.email),
    organizationId: firstSearchParam(resolvedSearchParams?.organizationId),
  });
  const repository = createPrismaUserInvitationRepository();
  const [organizations, invitations] = await Promise.all([
    repository.listInviteOrganizations(),
    repository.listInvitations({
      status: filters.status,
      email: filters.email,
      organizationId: filters.organizationId,
      limit: 100,
    }),
  ]);
  const viewModel = createUserInvitationAdminViewModel({
    actor: activeContext,
    organizations,
    invitations,
    filters,
    createdInvitationLink: firstSearchParam(resolvedSearchParams?.inviteLink),
  });
  const status = firstSearchParam(resolvedSearchParams?.statusMessage);
  const error = firstSearchParam(resolvedSearchParams?.error);

  return (
    <DashboardShell
      activeHref="/app/admin/invitations"
      navigation={adminNavigation}
      organizationName={activeContext.organizationName}
      roleLabel="Platform Admin"
    >
      <div className="ct-page-stack">
        <PageHeader
          eyebrow="Platform admin"
          subtitle="Invite breeder and breeding-station users into an organization without open self-registration into privileged roles."
          title="User invitations"
        />
        {status === "created" ? (
          <Notice title="Invitation created" tone="success">
            The invitation was created and queued for email delivery.
          </Notice>
        ) : null}
        {viewModel.createdInvitationLink ? (
          <Notice title="Invitation link" tone="info">
            {viewModel.createdInvitationLink}
          </Notice>
        ) : null}
        {error ? (
          <Notice title="Invitation was not saved" tone="danger">
            {error}
          </Notice>
        ) : null}
        <Notice title="Queued email delivery" tone="info">
          {viewModel.emailDeliveryNote}
        </Notice>
        <Card aria-labelledby="admin-invite-create-heading">
          <SectionHeader
            id="admin-invite-create-heading"
            subtitle="Create a time-bound invite for a breeder or breeding-station user."
            title="Create invitation"
          />
          <form action={createInvitationAction} className="ct-form-grid" method="post">
            <Field htmlFor="invitation-email" label="Email">
              <Input
                id="invitation-email"
                name="email"
                placeholder="user@example.com"
                required
                type="email"
              />
            </Field>
            <Field htmlFor="invitation-organization-id" label="Organization">
              <Select id="invitation-organization-id" name="organizationId" required>
                <option value="">Select organization</option>
                {viewModel.organizationOptions.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="invitation-role-code" label="Role">
              <Select id="invitation-role-code" name="roleCode" required>
                <option value="">Select role</option>
                {viewModel.roleOptions.map((roleCode) => (
                  <option key={roleCode} value={roleCode}>
                    {formatInvitationLabel(roleCode)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="invitation-expiry-days" label="Expires in days">
              <Input
                defaultValue="7"
                id="invitation-expiry-days"
                max={30}
                min={1}
                name="expiresInDays"
                required
                type="number"
              />
            </Field>
            <div className="ct-form-actions">
              <Button type="submit">Create invitation</Button>
            </div>
          </form>
        </Card>
        <Card aria-labelledby="admin-invite-filter-heading">
          <SectionHeader
            count={`${viewModel.rows.length} invitations`}
            id="admin-invite-filter-heading"
            title="Invitation query"
          />
          <form action="/app/admin/invitations" className="ct-form-grid ct-form-grid--filters" method="get">
            <Field htmlFor="invitation-filter-status" label="Status">
              <Select
                defaultValue={viewModel.filters.status}
                id="invitation-filter-status"
                name="status"
              >
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="EXPIRED">Expired</option>
                <option value="REVOKED">Revoked</option>
              </Select>
            </Field>
            <Field htmlFor="invitation-filter-email" label="Email">
              <Input
                defaultValue={viewModel.filters.email}
                id="invitation-filter-email"
                name="email"
              />
            </Field>
            <Field htmlFor="invitation-filter-organization-id" label="Organization">
              <Select
                defaultValue={viewModel.filters.organizationId}
                id="invitation-filter-organization-id"
                name="organizationId"
              >
                <option value="">All organizations</option>
                {viewModel.organizationOptions.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="ct-form-actions">
              <Button type="submit">Filter</Button>
              <ButtonLink href="/app/admin/invitations" variant="secondary">
                Reset
              </ButtonLink>
            </div>
          </form>
        </Card>
        <Card aria-labelledby="admin-invite-table-heading">
          <SectionHeader
            count={`${viewModel.rows.length} records`}
            id="admin-invite-table-heading"
            title="Invitations"
          />
          <Table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Organization</th>
                <th>Role</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Email</th>
                <th>Accepted</th>
              </tr>
            </thead>
            <tbody>
              {viewModel.rows.length > 0 ? (
                viewModel.rows.map((invitation) => (
                  <tr key={invitation.id ?? `${invitation.email}:${invitation.expiresAt}`}>
                    <td>{invitation.email}</td>
                    <td>{invitation.organizationLabel}</td>
                    <td>{invitation.roleLabel}</td>
                    <td><StatusBadge value={invitation.status} /></td>
                    <td>{invitation.expiresAt}</td>
                    <td><StatusBadge value={invitation.emailDeliveryStatus} /></td>
                    <td>{invitation.acceptedAt}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>No invitations match this query.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      </div>
    </DashboardShell>
  );
}

async function createInvitationAction(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const repository = createPrismaUserInvitationRepository();
  const headerList = await headers();
  let invitationLink = "";

  try {
    const result = await createManagedUserInvitation({
      actor: activeContext,
      repository,
      email: stringFormValue(formData, "email"),
      organizationId: stringFormValue(formData, "organizationId"),
      roleCode: stringFormValue(formData, "roleCode"),
      expiresInDays: stringFormValue(formData, "expiresInDays"),
      inviteBaseUrl: buildAcceptInviteBaseUrl(headerList),
    });
    invitationLink = result.invitationLink;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invitation creation failed.";
    redirect(`/app/admin/invitations?error=${encodeURIComponent(message)}`);
  }

  const params = new URLSearchParams({
    statusMessage: "created",
    inviteLink: invitationLink,
  });

  redirect(`/app/admin/invitations?${params.toString()}`);
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function stringFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function buildAcceptInviteBaseUrl(headerList: Headers) {
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");

  if (!host) {
    return "/accept-invite";
  }

  const protocol = headerList.get("x-forwarded-proto") ?? "http";

  return `${protocol}://${host}/accept-invite`;
}
