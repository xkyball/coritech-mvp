# Ticket 1.8 — Implement Audit Log v1

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 1 — Core Data Foundation

## Type
Backend / Security / Core Trust

## Objective
Record trust-relevant actions so CoriTech can prove who did what, when and under which role.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Implement AuditLog with actor, role, organization, action, object type/id, previous/new values, reason, IP/user agent and timestamp.
- Actions include CREATE, UPDATE, STATUS_CHANGE, UPLOAD_DOCUMENT, VIEW_DOCUMENT, CREATE_PROOF_EVENT, CHANGE_PERMISSION, ADMIN_EDIT, CREATE_AMENDMENT, LOGIN, LOGOUT.
- Add service helper and query by object.
- Integrate hooks for critical workflow actions.

## Acceptance Criteria
- [ ] Audit logs are created for critical workflow actions.
- [ ] Audit logs include actor, role, organization and timestamp.
- [ ] Admin edits and status changes are logged.
- [ ] Document uploads/views can be logged.
- [ ] Audit logs are queryable by object.
- [ ] Normal users cannot edit audit logs.

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
Implement AuditLog v1 for CoriTech. Add audit log model, migration, service helper and middleware/hooks for critical actions: order creation, status changes, shipment updates, document upload/view, proof event creation, permission changes and admin edits. Ensure audit logs are append-only from normal application flows and queryable by object type and object ID.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 1.8 — Implement Audit Log v1.

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
