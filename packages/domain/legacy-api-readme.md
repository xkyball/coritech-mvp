# CoriTech API

This directory contains API-side contracts introduced by approved Phase 1
tickets.

- `config/` contains the Ticket 0.3 environment contract and validation helper.
- `db/` contains approved database migrations.
- `domain/catalog/` contains the Ticket 1.2 stallion and semen listing model,
  endpoint contracts, validation, ownership checks, search helpers and listing
  audit hook.
- `domain/identity/` contains the Ticket 1.1 user, organization and role model
  helper plus TypeScript declarations.
- `domain/orders/` contains the Ticket 1.3 semen order model, status transition
  rules, order status history preparation, endpoint contracts and audit/proof
  hooks.
- `domain/shipments/` contains the Ticket 1.4 shipment and normalized tracking
  event model, endpoint contracts, validation, station-scoped write checks and
  audit/proof hooks.
- `domain/documents/` contains the Ticket 1.5 document metadata and evidence
  attachment model, endpoint contracts, object-storage reference validation,
  classification-aware access checks and upload/view audit hooks.
- `domain/proof/` contains the Ticket 1.6 ProofEvent model, hook-to-proof
  preparation service, explicit persistence helper, append-only deletion policy,
  proof-event creation audit hook and Ticket 1.7 verification-level taxonomy
  derivation.
- `domain/audit/` contains the Ticket 1.8 append-only AuditLog model, audit
  hook materialization helper, object query access checks and normalized action
  list.
- `domain/amendments/` contains the Ticket 1.9 Amendment model, admin-only
  creation service, original/amended value preservation, audit hook and optional
  admin-correction proof hook.
- `domain/access/` contains the Ticket 2.3 AccessPermission model, object-level
  grant/revoke helpers, time-bounded service checks and permission-change audit
  hooks. The future `BUYER_VIEW` scope is reserved but not grantable or active in
  Phase 1.
- `domain/auth/` contains the Ticket 2.1 managed authentication provider
  contract, hosted sign-up/login/logout redirects, provider-managed password
  reset and email verification request contracts, internal User mapping,
  session-context helper and the Ticket 2.2 framework-neutral RBAC middleware.

No custom password handling, payment handling, logistics provider adapter,
object-storage provider integration, automatic proof-event generation, admin
amendment UI/workflow automation, AI behavior, blockchain logic or future
buyer-view automation is implemented here yet.

Future API code must be introduced by an approved Phase 1 ticket and must keep
configuration, auditability and ownership boundaries explicit.
