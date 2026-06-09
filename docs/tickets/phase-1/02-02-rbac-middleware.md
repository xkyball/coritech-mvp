# Ticket 2.2 — Implement RBAC permission middleware

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 2 — Auth & Permissions

## Type
Backend / Security

## Objective
Ensure role-specific access to the same proof infrastructure.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Implement API permission middleware.
- Enforce breeder, breeding station and platform admin access rules.
- Apply role, organization and order-level checks.
- Return 403 on unauthorized access.
- Add tests for allowed and denied cases.

## Acceptance Criteria
- [ ] Breeder can view/create own orders only.
- [ ] Breeding Station can manage own listings and assigned orders.
- [ ] Platform Admin access is controlled and logged.
- [ ] Unauthorized access returns 403.
- [ ] Permission failures are logged where relevant.
- [ ] Tests cover positive and negative access cases.

## Not in Scope
- Blockchain / token logic
- AI insights or AI claims
- Full marketplace automation
- Full equine data space automation
- Federation/studbook automation unless explicitly required
- Sensor / wearable data ingestion
- Unrestricted buyer access
- Custom authentication when managed auth is available
- Public unrestricted document links
- Vendor-owned production-critical account assumptions

## Required Output
- Code changes or documentation changes required by this ticket.
- Tests where implementation changes behavior or data model.
- Migrations where data model changes.
- Documentation updates where architecture, security, data model or ownership is affected.
- Short implementation summary.
- List of assumptions and known limitations.

## Codex Execution Prompt
```text
Implement RBAC middleware for CoriTech. Enforce role-based, organization-level and order-level access for breeders, breeding stations and platform admins. Add permission helper functions, API middleware and tests. Ensure unauthorized access returns 403 and no user can view unrelated orders or documents.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 2.2 — Implement RBAC permission middleware.

Use this ticket file as the source of truth.

Rules:
- Implement only this ticket.
- Follow the acceptance criteria exactly.
- Do not implement future-phase features.
- Do not add AI, blockchain/token, full marketplace automation, federation automation, sensor/wearable ingestion or unrestricted buyer access.
- Add tests where relevant.
- Update documentation if relevant.
- Keep the architecture modular and due-diligence ready.
- Return an acceptance-criteria checklist after implementation.
```

## Review Checklist
- [ ] Scope stayed inside this ticket.
- [ ] Acceptance criteria are demonstrably met.
- [ ] Tests were added or consciously not required.
- [ ] No secrets were committed.
- [ ] No future-phase features were accidentally implemented.
- [ ] Audit/proof hooks were added where relevant.
- [ ] Ownership / transferability implications were documented where relevant.
