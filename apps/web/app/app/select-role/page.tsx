import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  Badge,
  Button,
  ButtonLink,
  Card,
  PageHeader,
  SectionHeader,
} from "../../../components/ui";
import { createDashboardContextOptions } from "../../../features/auth/active-context-runtime.mjs";
import { AUTH_ROUTES } from "../../../features/auth/auth-routes.mjs";
import { resolveActiveRoleContext } from "../../../features/auth/role-routing.mjs";
import { readManagedAuthSessionFromCookieHeader } from "../../../features/auth/server-session";

export const dynamic = "force-dynamic";

export default async function SelectRolePage() {
  const session = await readManagedAuthSessionFromCookieHeader(
    (await headers()).get("cookie"),
  );

  if (!session) {
    redirect(`${AUTH_ROUTES.loginPage}?returnTo=${encodeURIComponent(AUTH_ROUTES.selectRole)}`);
  }

  const resolution = resolveActiveRoleContext({
    session,
  });

  if (resolution.status === "unauthenticated") {
    redirect(`${AUTH_ROUTES.loginPage}?returnTo=${encodeURIComponent(AUTH_ROUTES.selectRole)}`);
  }

  if (resolution.status === "no-role") {
    redirect(AUTH_ROUTES.noRole);
  }

  if (resolution.status === "resolved") {
    redirect(AUTH_ROUTES.appHome);
  }

  const contextOptions = createDashboardContextOptions(resolution.availableContexts);

  return (
    <main className="ct-main" aria-labelledby="select-role-title">
      <PageHeader
        eyebrow="Role selection"
        meta={<Badge tone="info">Multiple roles</Badge>}
        subtitle="Choose the active organization and role context before opening protected workflow pages."
        title="Select workspace context"
      />
      <Card>
        <SectionHeader
          id="select-role-title"
          subtitle="The context persistence and switch action are implemented by the active organization role context ticket."
          title="Available role routes"
        />
        <div className="ct-detail-grid">
          {contextOptions.map((option) => (
            <form action={AUTH_ROUTES.appHome + "/context/switch"} key={option.key} method="post">
              <input name="activeContextKey" type="hidden" value={option.key} />
              <Button type="submit">
                {option.label}
              </Button>
            </form>
          ))}
        </div>
        <div className="ct-form-actions">
          <ButtonLink href={AUTH_ROUTES.logoutPage} variant="secondary">
            Sign out
          </ButtonLink>
        </div>
      </Card>
    </main>
  );
}
