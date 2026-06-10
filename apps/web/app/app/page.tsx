import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  ACTIVE_CONTEXT_COOKIE_NAME,
  parseActiveContextCookie,
} from "../../features/auth/active-context-runtime.mjs";
import { AUTH_ROUTES } from "../../features/auth/auth-routes.mjs";
import { resolveAppLanding } from "../../features/auth/role-routing.mjs";
import { readManagedAuthSessionFromCookieHeader } from "../../features/auth/server-session";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const cookieHeader = (await headers()).get("cookie");
  const session = await readManagedAuthSessionFromCookieHeader(cookieHeader);

  if (!session) {
    redirect(`${AUTH_ROUTES.loginPage}?returnTo=${encodeURIComponent(AUTH_ROUTES.appHome)}`);
  }

  const landing = resolveAppLanding({
    session,
    activeContext: parseActiveContextCookie(
      (await cookies()).get(ACTIVE_CONTEXT_COOKIE_NAME)?.value,
    ),
  });

  if (landing.status === "redirect") {
    redirect(landing.destination);
  }

  redirect(landing.page === "ROLE_SELECTION" ? AUTH_ROUTES.selectRole : AUTH_ROUTES.noRole);
}
