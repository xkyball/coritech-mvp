import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  Badge,
  ButtonLink,
  MetricCard,
} from "../components/ui";
import {
  AUTH_ROUTES,
} from "../features/auth/auth-routes.mjs";
import { readManagedAuthSessionFromCookieHeader } from "../features/auth/server-session";

const workspaceEntryPoints = [
  {
    href: "/app/breeder",
    label: "Breeder workspace",
    detail: "Orders, catalog browsing, document upload and order activity.",
  },
  {
    href: "/app/station",
    label: "Breeding station workspace",
    detail: "Order receipt, confirmation, shipment tracking, stallions and listings.",
  },
  {
    href: "/app/admin",
    label: "Platform admin workspace",
    detail: "Operational reporting, users, invitations, support, audit logs and permissions.",
  },
] as const;

const operationalAreas = [
  "Active context switcher",
  "Semen catalog",
  "Draft and submitted orders",
  "Station fulfilment",
  "Shipment management",
  "Controlled documents",
  "Support requests",
  "Payment references",
] as const;

const assuranceAreas = [
  "Proof timeline",
  "Audit log viewer",
  "Admin amendments",
  "Permission management",
  "Operational reporting",
  "Invitation onboarding",
] as const;

const publicLinks = [
  { href: "/accept-invite", label: "Accept invitation" },
  { href: "/contact", label: "Contact" },
  { href: "/data-access", label: "Data access" },
] as const;

export default async function Home() {
  const cookieHeader = (await headers()).get("cookie");

  if (await readOptionalSession(cookieHeader)) {
    redirect(AUTH_ROUTES.appHome);
  }

  return (
    <main className="ct-home">
      <section className="ct-home__hero" aria-labelledby="page-title">
        <div>
          <p className="ct-eyebrow">Verified equine workflow</p>
          <h1 id="page-title">CoriTech</h1>
          <p>
            One working application for breeder orders, breeding station fulfilment,
            controlled documentation, platform administration and audit-ready proof context.
          </p>
          <div className="ct-page-header__meta">
            <Badge tone="info">Role-aware app</Badge>
            <Badge tone="accent">Audit-ready workflows</Badge>
            <Badge tone="success">Private document access</Badge>
          </div>
          <div className="ct-home__actions">
            <ButtonLink href="/login?returnTo=%2Fapp" variant="primary">
              Sign in
            </ButtonLink>
            <ButtonLink href="/app" variant="secondary">
              Open app
            </ButtonLink>
          </div>
        </div>
        <div className="ct-home__stack" aria-label="Public entry points">
          {publicLinks.map((item) => (
            <ButtonLink href={item.href} key={item.href} variant="secondary">
              {item.label}
            </ButtonLink>
          ))}
        </div>
      </section>

      <section className="ct-home__band ct-home__band--proof" aria-labelledby="workspace-title">
        <div>
          <p className="ct-eyebrow">Role entry points</p>
          <h2 id="workspace-title">A single app shell for every active Phase 1 context.</h2>
        </div>
        <ol className="ct-home__list">
          {workspaceEntryPoints.map((item, index) => (
            <li key={item.href}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <a href={item.href}>{item.label}</a>
              <small>{item.detail}</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="ct-home__band" aria-labelledby="workflow-title">
        <div>
          <p className="ct-eyebrow">Operational surface</p>
          <h2 id="workflow-title">Current workflows available after sign-in.</h2>
        </div>
        <ol className="ct-home__workflow">
          {operationalAreas.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="ct-home__band" aria-labelledby="assurance-title">
        <div>
          <p className="ct-eyebrow">Readiness and control</p>
          <h2 id="assurance-title">Admin, audit and proof areas are part of the main app.</h2>
        </div>
        <div className="ct-home__metrics">
          {assuranceAreas.map((item) => (
            <MetricCard key={item} label="Available surface" value={item} />
          ))}
        </div>
      </section>
    </main>
  );
}

async function readOptionalSession(cookieHeader: string | null) {
  try {
    return await readManagedAuthSessionFromCookieHeader(cookieHeader);
  } catch {
    return null;
  }
}
