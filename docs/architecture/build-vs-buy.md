# Build-vs-Buy Rationale

## Principle

CoriTech should build the domain proof layer and workflow context that create
defensibility. Commodity infrastructure should be bought or managed where this
reduces delivery risk, security risk and investor diligence friction.

## Phase 1 Decisions

| Area | Direction | Rationale | Status |
| --- | --- | --- | --- |
| Semen ordering workflow | Build | Domain workflow is the MVP wedge and source of proof events | `[PENDING_IMPLEMENTATION]` |
| Proof event model | Build | CoriTech-specific trust layer and audit narrative | Implemented by Ticket 1.6 |
| Verification level v1 | Build | Requires CoriTech domain rules and reviewer clarity | Implemented by Ticket 1.7 |
| Audit trail | Build | Core diligence evidence and operational control | Implemented by Ticket 1.8 |
| Authentication | Buy/manage | Managed auth reduces security and compliance risk | `[PENDING_VENDOR_SELECTION]` |
| Object storage | Buy/manage | Evidence files require durable controlled storage | `[PENDING_VENDOR_SELECTION]` |
| Email delivery | Buy/manage | Commodity notification infrastructure | `[PENDING_VENDOR_SELECTION]` |
| Hosting/database | Buy/manage | Commodity infrastructure with clear CoriTech account ownership | `[PENDING_VENDOR_SELECTION]` |
| Logistics provider connection | Adapter first | Phase 1 should not depend on full automation | `[PENDING_PROVIDER_SELECTION]` |
| Payment processing | Reference first | Phase 1 can track payment references before deep payment automation | `[PENDING_FUTURE_TICKET]` |

## Explicitly Delayed

| Area | Phase 1 decision |
| --- | --- |
| AI | Delayed; no AI claims, scoring or automated insight product in Phase 1 |
| Blockchain/token | Delayed; proof is workflow-generated, not tokenized |
| Full data-space automation | Delayed; Phase 1 records controlled workflow evidence only, not full equine data space automation |
| Full federation automation | Delayed; no automated federation/studbook synchronization unless later approved |
| Sensor/wearable ingestion | Delayed; no device or wearable data pipeline in Phase 1 |
| Full marketplace automation | Delayed; Phase 1 focuses on controlled operational ordering |

## Vendor Control Rule

Production-critical accounts must be CoriTech-owned or contractually
transferable to CoriTech. Vendor-owned production-critical account assumptions
are not accepted without a documented exception.
