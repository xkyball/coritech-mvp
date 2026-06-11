# User Manual Source Package

Status: SOURCE EXTRACTION ONLY

This directory captures source information for a future CoriTech User Manual. It is not the User Manual, and it does not introduce or change product behavior.

## Purpose

The package inventories user-facing behavior that is currently present in the CoriTech codebase, with evidence references back to routes, components, services, tests, and existing documentation. It separates implemented behavior from placeholders, demo-only behavior, planned scope, and unknown areas.

## Files

- `codebase-scan-summary.md` - framework, routing, auth, data model, app areas, docs, tests, and implementation cautions.
- `user-facing-routes-and-screens.md` - route and screen inventory for public, authenticated, breeder, station, document, and admin areas.
- `role-and-permission-source.md` - roles, active context, protected routes, permissions, and enforcement notes.
- `user-journeys-source.md` - journey inventory with steps, missing pieces, services, entities, permissions, evidence, and status.
- `workflow-statuses-and-actions.md` - status values, displayed meanings, transitions, and action support.
- `forms-and-fields-inventory.md` - forms, fields, required inputs, validation, success/error behavior, and evidence.
- `messages-and-notifications-inventory.md` - empty states, warnings, validation messages, notifications, and system feedback.
- `admin-and-support-source.md` - admin workspaces, support workflow, records affected, logging, and limitations.
- `domain-object-source.md` - user-relevant domain objects, fields, relationships, and manual relevance.
- `existing-docs-source-inventory.md` - existing documentation and test sources that can support a later manual.
- `manual-gap-analysis.md` - manual gaps, terminology issues, screenshot needs, and features to exclude for now.
- `recommended-user-manual-outline-later.md` - suggested future structure only; not manual content.
- `commands-run.md` - commands attempted while producing this extraction package and their results.

## Evidence and Confidence Conventions

Evidence entries use file paths and, where helpful, component, route, service, model, or test names. Confidence levels mean:

- `HIGH` - behavior is implemented in route/component/service/test code and source evidence is direct.
- `MEDIUM` - behavior is present but depends on configuration, repository wiring, seeded/demo data, or multiple inferred sources.
- `LOW` - source evidence is incomplete, stale, placeholder-like, or only referenced in documentation.

Status labels:

- `IMPLEMENTED` - supported by current source code.
- `PARTIALLY_IMPLEMENTED` - meaningful behavior exists, but limitations remain.
- `PLACEHOLDER` - page, copy, or service placeholder exists without complete product behavior.
- `DEMO_ONLY` - behavior depends on local/demo wiring, seed data, in-memory repositories, or mocked adapters.
- `NOT_FOUND` - searched for but not found.
- `UNKNOWN` - source evidence was insufficient.

## Boundaries

This package does not include a finished manual, training copy, screenshots, or new product workflows. Future manual-writing work should use these files as source material and should re-check live code before publishing, especially for auth, admin, logistics, payments, support, and notification behavior.

