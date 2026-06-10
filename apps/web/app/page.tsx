import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  Badge,
  ButtonLink,
  MetricCard,
} from "../components/ui";
import {
  AUTH_ROUTES,
  hasAuthenticatedSessionCookie,
} from "../features/auth/auth-routes.mjs";

const proofSteps = [
  "Trigger",
  "Documentation",
  "Signature",
  "Verification Level",
  "Audit Trail",
] as const;

const phaseOneFlow = [
  "Breeder",
  "Semen Listing",
  "Semen Order",
  "Station Confirmation",
  "Shipment Tracking",
  "Documentation",
  "Basic Proof Event",
  "Audit Log",
] as const;

const foundation = [
  "Next.js App Router",
  "TypeScript",
  "PostgreSQL",
  "Prisma ORM",
  "Docker Compose",
] as const;

export default async function Home() {
  const cookieHeader = (await headers()).get("cookie");

  if (hasAuthenticatedSessionCookie(cookieHeader)) {
    redirect(AUTH_ROUTES.appHome);
  }

  return (
    <main className="ct-home">
      <section className="ct-home__hero" aria-labelledby="page-title">
        <div>
          <p className="ct-eyebrow">CoriTech MVP</p>
          <h1 id="page-title">Phase 1: Semen Ordering, Tracking &amp; Documentation</h1>
          <p>Proof Chain-ready foundation for verified horse passport and equine data workflows.</p>
          <div className="ct-page-header__meta">
            <Badge tone="info">Operational MVP</Badge>
            <Badge tone="accent">Due diligence ready</Badge>
          </div>
        </div>
        <div className="ct-home__stack" aria-label="Standard development stack">
          {foundation.map((item) => (
            <MetricCard key={item} label="Foundation" value={item} />
          ))}
          <ButtonLink href="/breeder-dashboard" variant="primary">
            Open breeder workspace
          </ButtonLink>
          <ButtonLink href="/station-dashboard" variant="secondary">
            Open station workspace
          </ButtonLink>
        </div>
      </section>

      <section className="ct-home__band ct-home__band--proof" aria-labelledby="proof-title">
        <div>
          <p className="ct-eyebrow">Core Proof Logic</p>
          <h2 id="proof-title">Trigger -&gt; Documentation -&gt; Signature -&gt; Verification Level -&gt; Audit Trail</h2>
        </div>
        <ol className="ct-home__list">
          {proofSteps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="ct-home__band" aria-labelledby="workflow-title">
        <div>
          <p className="ct-eyebrow">Phase 1 Workflow</p>
          <h2 id="workflow-title">Operational wedge for breeders and breeding stations</h2>
        </div>
        <ol className="ct-home__workflow">
          {phaseOneFlow.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
