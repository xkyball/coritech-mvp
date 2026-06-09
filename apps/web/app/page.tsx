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

export default function Home() {
  return (
    <main className="status-shell">
      <section className="status-hero" aria-labelledby="page-title">
        <div className="status-hero__copy">
          <p className="eyebrow">CoriTech MVP</p>
          <h1 id="page-title">Phase 1: Semen Ordering, Tracking &amp; Documentation</h1>
          <p className="lede">Proof Chain-ready foundation for verified horse passport and equine data workflows.</p>
        </div>
        <div className="stack-panel" aria-label="Standard development stack">
          {foundation.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="proof-band" aria-labelledby="proof-title">
        <div>
          <p className="eyebrow">Core Proof Logic</p>
          <h2 id="proof-title">Trigger -&gt; Documentation -&gt; Signature -&gt; Verification Level -&gt; Audit Trail</h2>
        </div>
        <ol className="proof-chain">
          {proofSteps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="workflow-band" aria-labelledby="workflow-title">
        <div className="section-heading">
          <p className="eyebrow">Phase 1 Workflow</p>
          <h2 id="workflow-title">Operational wedge for breeders and breeding stations</h2>
        </div>
        <ol className="workflow-list">
          {phaseOneFlow.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
