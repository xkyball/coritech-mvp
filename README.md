# CoriTech Phase 1 MVP Repository

This repository is the CoriTech-controlled technical ownership base for the
Phase 1 MVP wedge.

Phase 1 focuses on the operational semen-ordering workflow and the evidence
foundation needed for the Proof Chain. Product functionality is implemented only
through approved Phase 1 tickets.

```text
Trigger -> Documentation -> Signature -> Verification Level -> Audit Trail
```

## Repository Structure

- `app/` - Placeholder for the future application frontend.
- `api/` - Placeholder for the future application API.
- `infra/` - Placeholder for future infrastructure configuration.
- `docs/` - Ticket backlog, ownership records, and due-diligence materials.

Each area currently contains documentation only. Authentication, data models,
user interfaces, payments, logistics adapters, AI, blockchain, and marketplace
logic are intentionally not implemented as part of repository setup.

## Start Here

Open the Phase 1 ticket index:

`docs/tickets/phase-1/README.md`

Implement one ticket at a time. The first repository setup ticket is:

`docs/tickets/phase-1/00-01-repository-setup.md`

## Ownership Controls

Repository ownership and branch-control evidence is tracked in:

- `docs/source-control/repository-ownership.md`
- `docs/source-control/branch-protection.md`

Before this repository is used for production-critical work, the source-control
organization, repository administrators, backup administrator, branch protection,
and required pull-request workflow must be confirmed in those documents.

## Baseline Rules

- Do not commit secrets or local `.env` files.
- Do not store product code only in personal or agency-owned repositories.
- Do not add future-phase technology claims or vendor assumptions without an
  approved ticket.
- Keep documentation, ownership, and transferability evidence current.

## Phase 1 Principle

Build the operational semen-ordering wedge as proof-chain-ready infrastructure:
workflow, roles, events, verification level v1, audit trail, controlled document access and clean ownership from day one.
