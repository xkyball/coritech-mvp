# Commands Run

Analysis date: 2026-06-10

| Command | Result | Notes |
| --- | --- | --- |
| npm test | PASS | Domain, config and web feature tests passed: 86 domain, 6 config, 31 web. |
| npm run build | PASS | Prisma client generated and Next.js build completed. Routes built: /, /app/catalog, /app/catalog/[listingId], /app/orders/[orderId], /app/orders/new, /app/station/listings, /breeder-dashboard, /station-dashboard. |
| npx prisma validate --schema packages/database/prisma/schema.prisma | FAILED | Root npx could not find prisma on PATH in this environment. |
| npx prisma migrate status --schema packages/database/prisma/schema.prisma | FAILED | Root npx could not find prisma on PATH in this environment. |
| npm run lint | FAILED | No root lint script exists. |
| npm run typecheck | FAILED | No root typecheck script exists. TypeScript still ran during npm run build. |
| npm --workspace @coritech/database exec prisma validate -- --schema prisma/schema.prisma | FAILED | DATABASE_URL was not set in the shell environment. |
| npm --workspace @coritech/database exec prisma migrate status -- --schema prisma/schema.prisma | FAILED | DATABASE_URL was not set in the shell environment. |
| DATABASE_URL=postgresql://coritech:...@localhost:5432/coritech_mvp?schema=public npm --workspace @coritech/database exec prisma validate -- --schema prisma/schema.prisma | PASS | Schema is valid. |
| DATABASE_URL=postgresql://coritech:...@localhost:5432/coritech_mvp?schema=public npm --workspace @coritech/database exec prisma migrate status -- --schema prisma/schema.prisma | FAILED | Prisma loaded the schema and attempted localhost:5432 but returned a schema engine connection error, consistent with no reachable local Postgres in this environment. |
| docker compose ps | FAILED | Docker socket access denied in this environment. |
| pg_isready -h localhost -p 5432 -U coritech -d coritech_mvp | FAILED | pg_isready is not installed in this environment. |

## Safety Notes

No destructive commands were run. Commands such as prisma migrate reset, rm -rf, dropping databases or deleting data were not attempted.
