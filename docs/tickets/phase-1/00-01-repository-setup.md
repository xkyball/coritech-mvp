# Ticket 0.1 — Set up CoriTech-owned source repository

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 0 — Setup & Control

## Type
Foundation / Ownership

## Objective
Create the technical ownership base so all product code, configuration and documentation live under CoriTech control from day one.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Create company-controlled GitHub/GitLab/Bitbucket organization.
- Create repositories or monorepo areas for app, api, infra and docs.
- Add README files, .gitignore, .env.example placeholder, issue/PR templates, CODEOWNERS.
- Set branch protection and required reviewers.
- Document repository ownership and backup admin access.

## Acceptance Criteria
- [ ] Repositories exist under CoriTech-controlled organization.
- [ ] No code is stored only in personal or agency-owned repositories.
- [ ] Admin access is held by CoriTech and at least one backup admin exists.
- [ ] Branch protection is active for main.
- [ ] Pull requests are required before merge.
- [ ] Repository ownership proof can be shown for due diligence.

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
Create the initial repository structure for a CoriTech MVP application. Set up a clean monorepo or multi-repo-ready structure with app, api, infra and docs directories. Add README files, pull request template, issue templates, CODEOWNERS, .gitignore, environment example files and clear ownership notes. Assume this is for an investor-grade MVP where repository transferability and technical due diligence matter.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 0.1 — Set up CoriTech-owned source repository.

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
