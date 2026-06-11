# CI/CD Baseline

Ticket 14.2 adds GitHub Actions workflow files under `.github/workflows/`.

## Ownership

The workflows must run in a CoriTech-controlled GitHub organization or
repository owner account. Production-critical deploy credentials must be stored
as GitHub environment secrets or in a future CoriTech-controlled secrets vault,
not in source files or markdown.

## Pull Request CI

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`.

The blocking verification job runs:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Failing lint, typecheck, tests, E2E or build steps fail the workflow and should
block merge through branch protection.

## Manual Deployment Workflow

`.github/workflows/deploy.yml` is manually triggered with a
`target_environment` input.

Staging:

- target: GitHub environment `staging`
- trigger: manual `workflow_dispatch`
- behavior: runs the same verification steps and emits a staging deploy
  placeholder
- setup: staging resource, secret and ownership requirements are documented in
  `docs/deployment/staging-production-setup.md`

Production:

- target: GitHub environment `production`
- trigger: manual `workflow_dispatch`
- behavior: runs the same verification steps and emits a production deploy
  placeholder
- approval: production must be protected in GitHub environment settings with
  required reviewers before the job can proceed

## Current Limitations

These workflows do not provision hosted infrastructure, run live migrations
against staging/production, configure production secrets or deploy to a vendor.
That remains owned by the staging/production setup ticket and later
infrastructure decisions.
