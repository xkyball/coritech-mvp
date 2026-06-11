import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  Badge,
  Button,
  ButtonLink,
  Card,
  DetailList,
  Field,
  Input,
  Notice,
  PageHeader,
  SectionHeader,
} from "../../components/ui";
import {
  acceptManagedUserInvitation,
  createInvitationAcceptViewModel,
  validateManagedUserInvitation,
} from "../../features/user-invitations/user-invitations.mjs";
import { createPrismaUserInvitationRepository } from "../../features/user-invitations/prisma-user-invitation-repository";

type AcceptInviteSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export default async function AcceptInvitePage({
  searchParams,
}: Readonly<{
  searchParams?: AcceptInviteSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const token = firstSearchParam(resolvedSearchParams?.token) ?? "";
  const error = firstSearchParam(resolvedSearchParams?.error);
  const repository = createPrismaUserInvitationRepository();
  const validation = await validateManagedUserInvitation({
    repository,
    token,
  });
  const viewModel = createInvitationAcceptViewModel({
    validation,
    token,
  });

  return (
    <main className="ct-main" aria-labelledby="accept-invite-title">
      <PageHeader
        eyebrow="CoriTech invitation"
        meta={<Badge tone={viewModel.canAccept ? "success" : "warning"}>{viewModel.state}</Badge>}
        subtitle="Accept your organization role invitation before using protected CoriTech workflows."
        title="Accept invitation"
      />
      <Card aria-labelledby="accept-invite-title">
        <SectionHeader
          id="accept-invite-title"
          subtitle={viewModel.message}
          title={viewModel.canAccept ? "Complete onboarding" : "Invitation unavailable"}
        />
        {error ? (
          <Notice title="Invitation was not accepted" tone="danger">
            {error}
          </Notice>
        ) : null}
        {viewModel.canAccept && viewModel.invitation ? (
          <>
            <DetailList
              items={[
                { term: "Email", value: viewModel.invitation.email },
                { term: "Organization", value: viewModel.invitation.organizationName },
                { term: "Role", value: viewModel.invitation.roleLabel },
                { term: "Expires", value: viewModel.invitation.expiresAt },
              ]}
            />
            <form action={acceptInvitationAction} className="ct-form-grid" method="post">
              <input name="token" type="hidden" value={viewModel.token} />
              <Field htmlFor="accept-invite-display-name" label="Display name">
                <Input
                  autoComplete="name"
                  id="accept-invite-display-name"
                  name="displayName"
                  placeholder="Your name"
                  required
                />
              </Field>
              <div className="ct-form-actions">
                <Button type="submit">Accept invitation</Button>
              </div>
            </form>
          </>
        ) : (
          <div className="ct-form-actions">
            <ButtonLink href="/login" variant="secondary">
              Sign in
            </ButtonLink>
          </div>
        )}
      </Card>
    </main>
  );
}

async function acceptInvitationAction(formData: FormData) {
  "use server";

  const repository = createPrismaUserInvitationRepository();
  const token = stringFormValue(formData, "token");
  let landingHref = "/app";
  let loginHint = "";

  try {
    const result = await acceptManagedUserInvitation({
      repository,
      token,
      displayName: stringFormValue(formData, "displayName"),
      auditContext: {
        userAgent: (await headers()).get("user-agent"),
      },
    });

    landingHref = result.landingHref;
    loginHint = result.user.email;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invitation acceptance failed.";
    redirect(`/accept-invite?token=${encodeURIComponent(token)}&error=${encodeURIComponent(message)}`);
  }

  const params = new URLSearchParams({
    returnTo: landingHref,
    onboarding: "accepted",
    loginHint,
  });

  redirect(`/login?${params.toString()}`);
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function stringFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}
