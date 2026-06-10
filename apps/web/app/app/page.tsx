import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_ROUTES, hasAuthenticatedSessionCookie } from "../../features/auth/auth-routes.mjs";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const cookieHeader = (await headers()).get("cookie");

  if (!hasAuthenticatedSessionCookie(cookieHeader)) {
    redirect(`${AUTH_ROUTES.loginPage}?returnTo=${encodeURIComponent(AUTH_ROUTES.appHome)}`);
  }

  redirect(AUTH_ROUTES.noRole);
}
