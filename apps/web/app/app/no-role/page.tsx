import { Alert, Badge, ButtonLink, PageHeader } from "../../../components/ui";
import { AUTH_ROUTES } from "../../../features/auth/auth-routes.mjs";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function NoRolePage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<SearchParams>;
}>) {
  const params = (await searchParams) ?? {};
  const status = readParam(params.status);

  return (
    <main className="ct-main" aria-labelledby="no-role-title">
      <PageHeader
        actions={<ButtonLink href={AUTH_ROUTES.logoutPage}>Sign out</ButtonLink>}
        eyebrow="Account setup"
        meta={<Badge tone="warning">Active context required</Badge>}
        subtitle="Your managed session is present, but CoriTech does not yet have an active organization and role context for this request."
        title="Account is not fully configured"
      />
      {status === "context-switch-requires-server-session" ? (
        <Alert title="Context switch was not applied" tone="warning">
          <p>
            CoriTech rejected the posted context because no server-resolved membership source was
            available for this session.
          </p>
        </Alert>
      ) : null}
      <section className="ct-state">
        <h3>Next step</h3>
        <p>
          A platform admin must connect this user to a breeder, breeding station or platform
          organization before protected workflow pages can render. CoriTech will not infer a role
          from the browser.
        </p>
      </section>
    </main>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
