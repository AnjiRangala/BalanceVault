# BalanceVault architecture

## Monorepo

- `apps/web` is the React + Vite client. It displays state and calls REST endpoints; it never performs money movement.
- `apps/api` is the Express API. Authentication, authorization, validation, and all financial rules will live here.
- PostgreSQL is the source of truth. Prisma ORM 7 and its PostgreSQL driver adapter (`@prisma/adapter-pg`) will be used by the API.

Both apps use JavaScript ES modules. The root npm workspace provides commands for running, building, testing, and managing the API database tooling.

## API modules (planned)

The backend will be organized by feature under `apps/api/src/modules`: `auth`, `users`, `accounts`, `transactions`, and `audit`. Each module can contain routes, request schemas, controllers, services, and repositories as it is implemented. Shared middleware, configuration, and database client code belong in their own directories.

## Financial integrity (planned)

Amounts are integer paise for INR. A financial operation will validate and authorize on the server, then run in one PostgreSQL transaction. It will lock or conditionally update affected account rows, check available funds, write a balanced double-entry journal, and update cached balances atomically. A unique idempotency key will prevent retries from posting twice. Posted ledger entries will be immutable; rejected attempts will be recorded separately. Periodic reconciliation will compare cached balances with journal totals.

Database constraints and a restricted application database role will reinforce these rules. No client request may set a user's identity or role as authoritative, or directly edit a balance. Auditors will be read-only and limited to assigned accounts and audit records.

## Local configuration

Copy `.env.example` to `.env` and supply local values when needed. No database credentials or JWT secret are stored in the repository. The API currently has a health endpoint and does not connect to PostgreSQL.
