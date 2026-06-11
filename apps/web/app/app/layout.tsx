import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  AUTH_ROUTES,
} from "../../features/auth/auth-routes.mjs";
import { ActiveContextBar } from "../../features/auth/ActiveContextBar";
import { readManagedAuthSessionFromCookieHeader } from "../../features/auth/server-session";

export const dynamic = "force-dynamic";

export default async function AuthenticatedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieHeader = (await headers()).get("cookie");

  if (!await readManagedAuthSessionFromCookieHeader(cookieHeader)) {
    redirect(`${AUTH_ROUTES.loginPage}?returnTo=${encodeURIComponent(AUTH_ROUTES.appHome)}`);
  }

  return (
    <>
      <ActiveContextBar />
      {children}
    </>
  );
}
