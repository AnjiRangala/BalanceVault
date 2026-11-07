# Backend deployment configuration

## Render service

Create a Node web service with the repository root as its root directory:

- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Runtime: Node 24 (also pinned by `.node-version`)
- Liveness check path: `/api/health`
- Readiness check path: `/api/ready`

The API listens on `0.0.0.0` and uses Render's `PORT` variable, falling back to `API_PORT` for local development. The frontend should be deployed separately as a static site. Set its `VITE_API_BASE_URL` to the HTTPS URL of this API.

## API environment

Required on the API service:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV=production` | Enables production origin and TLS validation. |
| `DATABASE_URL` | PostgreSQL URL for a dedicated login that inherits `balancevault_runtime`; never use an owner, migration, or superuser login. Production requires `sslmode=require`, `verify-ca`, or `verify-full`. |
| `JWT_ACCESS_SECRET` | At least 32 bytes; generate a random value, for example `openssl rand -base64 48`, and store it in Render's secret environment. |
| `WEB_ORIGIN` | Comma-separated exact HTTPS browser origins allowed by CORS. |
| `PORT` | Supplied by Render. |
| `DATABASE_POOL_MAX` | Optional per-instance pool cap; defaults to 10. Set based on database connection limits and the maximum number of service instances. |
| `DATABASE_CONNECTION_TIMEOUT_MS` | Optional connection timeout; defaults to 5000. |
| `DATABASE_READY_TIMEOUT_MS` | Optional readiness query timeout; defaults to 1500 ms. |
| `REDIS_URL` | Required Redis-compatible URL for shared auth limits (`redis://` or `rediss://`). Use a private Redis/Valkey service with TLS and ACL credentials where supported. |

`MIGRATION_DATABASE_URL` belongs only in a protected deployment/migration job, never on the running API service. Run `npm run db:migrate` as a separate release step using the migration login. The migration login must own the target database, be `NOINHERIT`, and have explicit membership with `SET` capability for the relevant `NOLOGIN` function-owner roles. Provision the database roles before migration with an administrator applying `apps/api/prisma/roles.sql`.

For a same-region Render Postgres internal URL, add `sslmode=require&uselibpqcompat=true` to require encrypted transport while permitting Render's self-signed internal certificate. For an external Render URL, use Render's provided hostname and TLS URL; do not replace it with a resolved IP. Render documents that internal TLS uses self-signed certs while external connections use Render-managed certificates. The compatibility parameter also avoids node-postgres's current warning that `sslmode=require` maps to certificate verification in its default mode.

The migration owner should not be a superuser. The runtime login should be a member only of `balancevault_runtime`, with no membership in the migration, posting, authentication, or account function-owner roles. API startup checks this membership boundary and fails closed if it is violated.

## Operational limitations

- `/api/health` is liveness only. `/api/ready` runs `SELECT 1` with a bounded timeout and returns only a generic status; it does not reveal database errors.
- Login and registration rate limits use a shared Redis store across API instances. Startup fails if Redis cannot connect. Requests fail closed with a generic 503 if the store becomes unavailable. Configure Redis with sufficient availability because login and registration will be unavailable during a Redis outage.
- For local development, install and start Redis, then use `REDIS_URL=redis://127.0.0.1:6379/0`. Auth endpoints intentionally do not fall back to per-process memory when Redis is unavailable.
- Pool limits apply per process. Multiply `DATABASE_POOL_MAX` by the maximum instance count and reserve connections for migrations and operations.
- The API logs only generic server-error events and error class names. Do not enable driver/SQL debug logging or log connection URLs in production.
- This repository has no Render blueprint or automated role-provisioning pipeline. Configure secrets and the separate migration job in Render before deployment.
