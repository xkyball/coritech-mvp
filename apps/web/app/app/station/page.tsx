import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  ACTIVE_CONTEXT_COOKIE_NAME,
  parseActiveContextCookie,
} from "../../../features/auth/active-context-runtime.mjs";
import { AUTH_ROUTES } from "../../../features/auth/auth-routes.mjs";
import { resolveRoleRoute } from "../../../features/auth/role-routing.mjs";
import { readManagedAuthSessionFromCookieHeader } from "../../../features/auth/server-session";

export const dynamic = "force-dynamic";

export default async function StationAppRoutePage() {
  const cookieHeader = (await headers()).get("cookie");
  const session = await readManagedAuthSessionFromCookieHeader(cookieHeader);

  if (!session) {
    redirect(`${AUTH_ROUTES.loginPage}?returnTo=${encodeURIComponent(AUTH_ROUTES.stationApp)}`);
  }

  const result = resolveRoleRoute({
    session,
    activeContext: parseActiveContextCookie(
      (await cookies()).get(ACTIVE_CONTEXT_COOKIE_NAME)?.value,
    ),
    requiredRoleCode: "BREEDING_STATION",
  });

  if (result.status === "redirect") {
    redirect(result.destination);
  }

  redirect(result.page === "ROLE_SELECTION" ? AUTH_ROUTES.selectRole : AUTH_ROUTES.noRole);
}
