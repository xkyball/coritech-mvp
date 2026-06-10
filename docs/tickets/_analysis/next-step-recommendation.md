# Next-Step Recommendation

Updated: 2026-06-10

## Recommended Next Ticket

18-01 Application Scaffold

## Why This Is Next

The app now has substantial real workflow implementation, but the repository still lacks root lint/typecheck scripts and a health endpoint. Those gaps directly blocked safe verification commands and make CI/E2E readiness weaker than the current codebase deserves. This is a high-priority foundation ticket and should be finished before adding more product surface.

## What It Unlocks

- Reliable local verification commands.
- CI/CD baseline.
- E2E test baseline.
- Staging readiness and health checks.
- Safer future ticket implementation.

## Dependencies

- Existing package workspace structure.
- Existing Next.js app and Prisma setup.
- Current passing npm test and npm run build baseline.

## What Should Not Be Implemented Yet

- No admin dashboard or reporting.
- No notification/email provider.
- No payment processing.
- No logistics provider integration.
- No AI, blockchain, marketplace automation, federation or sensor ingestion.

## Acceptance Criteria For The Next Codex Task

- Add root lint and typecheck scripts that work across the current workspace.
- Add a minimal health endpoint appropriate for local/staging checks.
- Keep changes limited to scaffold/tooling/health behavior.
- Preserve existing app routes and product behavior.
- Run npm test, npm run build, npm run lint and npm run typecheck.
- Update docs if command names or health-check behavior change.

## Suggested Codex Prompt For The Next Task

Implement docs/tickets/phase-1-1/18-01-application-scaffold.md only. Treat the ticket as the source of truth. Do not implement product features. Add missing root lint/typecheck scripts and a minimal health endpoint that fits the existing Next.js workspace. Preserve existing behavior, run safe verification commands, update relevant docs, and commit the changes with a meaningful message.

## Next 3 Tickets After That

1. 18-27 Test Framework Baseline
2. 02-02 RBAC Middleware
3. 18-06 Stallion Management UI

See unfinished-ticket-order.md for the complete dependency-aware order of all unfinished tickets.
