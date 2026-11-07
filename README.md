# BalanceVault

BalanceVault is a financial ledger application with a React/Vite frontend, an Express API, and PostgreSQL. Financial amounts are integer paise; all money movement is performed by protected PostgreSQL functions.

## Local development

Requirements: Node.js 24, npm 10 or 11, PostgreSQL 17, and a Redis-compatible service for auth rate limiting.

```sh
npm ci
cp .env.example .env
# Set DATABASE_URL to a local login that inherits balancevault_runtime.
# Set JWT_ACCESS_SECRET with: openssl rand -base64 48
# Start local Redis and set REDIS_URL=redis://127.0.0.1:6379/0
npm run dev
```

The frontend runs at `http://localhost:5173` and the API at `http://localhost:3001`. Run either app with `npm run dev:web` or `npm run dev:api`.

## Database roles and migrations

Provision roles with an administrator by reviewing and applying `apps/api/prisma/roles.sql`. Create the database owned by `balancevault_migration_owner`; run Prisma migrations only with `MIGRATION_DATABASE_URL`. The API process uses only `DATABASE_URL`, whose login must inherit `balancevault_runtime`. Never set migration credentials on the API service.

```sh
npm run db:generate
npm run db:migrate
```

The initial migration explicitly switches to `balancevault_posting_owner` while creating its private functions and setting their ACLs. This fixes the migration role's `NOINHERIT` ownership boundary: membership permits an explicit `SET ROLE`, but does not otherwise confer owner privileges. The SQL change is limited to migration privilege sequencing; it does not change financial function bodies or their runtime grants. Because the already-published initial migration checksum changes, databases that recorded the previous version must not be redeployed against it without a deliberate Prisma migration-history reconciliation. New environments should use the corrected history from the outset.

## Deployment

For Render, deploy `apps/api` as a Node web service from the repository root. Use `npm ci && npm run build` as the build command and `npm start` as the start command. Configure the API's required variables from a secret manager; see [Deployment configuration](docs/DEPLOYMENT.md). Deploy the web frontend separately as a Vite static site and set `VITE_API_BASE_URL` to the public API origin.

Useful commands:

```sh
npm test
npm run build
npm run db:migrate
```

See [API documentation](docs/API.md) and [architecture](docs/ARCHITECTURE.md).

See [frontend authentication and session storage](docs/FRONTEND.md) for the browser token strategy and its security limitations.
