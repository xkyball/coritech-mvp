# Commands Run

Updated: 2026-06-10

## Successful

- npm test
  - Result: PASS.
  - Evidence: Domain 108 tests passed; config 6 tests passed; web 78 tests passed.

- npm run build
  - Result: PASS.
  - Evidence: Prisma generation and Next.js build completed.
  - Warnings: Prisma package.json prisma config deprecation; Next middleware convention deprecation; Turbopack NFT/import trace warning around Prisma/document access route.

- DATABASE_URL='postgresql://coritech:coritech_dev_password@localhost:5432/coritech_mvp?schema=public' npm --workspace @coritech/database exec prisma validate -- --schema prisma/schema.prisma
  - Result: PASS.

## Failed Or Not Available

- npm run lint
  - Result: FAIL.
  - Reason: missing root lint script.

- npm run typecheck
  - Result: FAIL.
  - Reason: missing root typecheck script. TypeScript compilation still ran as part of npm run build.

- npx prisma validate --schema packages/database/prisma/schema.prisma
  - Result: FAIL.
  - Reason: prisma executable was not available through npx in this shell path. Workspace exec was used instead.

- npm --workspace @coritech/database exec prisma validate -- --schema prisma/schema.prisma
  - Result: FAIL.
  - Reason: DATABASE_URL was not set. Retried with a local DATABASE_URL and it passed.

- DATABASE_URL='postgresql://coritech:coritech_dev_password@localhost:5432/coritech_mvp?schema=public' npm --workspace @coritech/database exec prisma migrate status -- --schema prisma/schema.prisma
  - Result: FAIL.
  - Reason: Prisma schema engine could not complete the local database status check. Local database service was not confirmed running.

- docker compose ps
  - Result: FAIL.
  - Reason: Docker API socket permission denied.

- pg_isready
  - Result: FAIL.
  - Reason: command not found in the shell environment.

## Safety Notes

No destructive commands were run. No migrations were reset. No database was dropped. No product features were implemented as part of this analysis refresh.
