# Ticket 2.1 — Integrate managed authentication provider

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 2 — Auth & Permissions

## Type
Integration / Security

## Objective
Use a proven authentication provider rather than building custom authentication.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Integrate managed auth provider.
- Configure login, logout, session handling, password reset and email verification if supported.
- Map external identity to internal User.
- Prepare admin MFA documentation.
- Use environment config from Ticket 0.3.

## Acceptance Criteria
- [ ] Users can sign up/login/logout.
- [ ] Auth identity maps to internal User.
- [ ] Password handling is not custom-built.
- [ ] Admin MFA is available or documented.
- [ ] Auth config is environment-based.
- [ ] Auth provider account is CoriTech-controlled.

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
Integrate a managed authentication provider into the CoriTech MVP. Implement login, logout, session handling, password reset, user profile mapping and environment-based configuration. Do not build custom password handling. Add documentation for admin MFA and provider account ownership.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 2.1 — Integrate managed authentication provider.

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
