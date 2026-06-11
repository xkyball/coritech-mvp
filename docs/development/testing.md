# Testing Baseline

CoriTech uses Node's built-in `node:test` runner for the Phase 1.1 baseline.
This keeps the stack small while still supporting unit, service integration and
future E2E tests.

## Commands

```bash
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
npm run lint
npm run typecheck
```

`npm test` is the CI-safe default and runs unit plus service integration tests.
`npm run test:e2e` runs the deterministic minimal MVP happy path added by
Ticket 18.28.

## Unit Tests

Place framework-neutral unit tests beside the module they cover using
`*.test.mjs`. Existing examples live under `packages/domain/src/**` and
`apps/web/features/**`.

## Service Integration Tests

Place service-level integration tests under `packages/domain/test/` with
the `*.integration.test.mjs` suffix when they combine multiple domain services
or shared test helpers. Use in-memory repositories or mock providers unless a
ticket explicitly requires a database-backed test.

## Test Database Strategy

Database-backed tests must use `TEST_DATABASE_URL`. Do not reuse local
development seed data as test fixtures, and do not point tests at production or
staging databases. When `TEST_DATABASE_URL` is not configured, tickets should
prefer deterministic in-memory service tests or document why the DB-dependent
test was not run.

## Test Factories And Auth Context

Shared test helpers live in `packages/domain/src/testing/test-kit.mjs`.
They provide deterministic users, organizations, role assignments, active
auth-context mocks, a safe test database strategy helper and simple external
provider mocks for email, storage, payment or logistics seams.

## Minimal E2E

The selected E2E baseline is Node test. `e2e/baseline.test.mjs` exercises the
core service journey with in-memory repositories and mocked document metadata,
without requiring a browser, database, object store or external provider
account. See `docs/development/minimal-e2e-happy-path.md` for coverage and run
instructions.

## External Providers

Tests must not use real provider credentials. Auth, email, object storage,
payment and logistics integrations should be mocked at the adapter boundary
unless a ticket explicitly configures a local equivalent.
