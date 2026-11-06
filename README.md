# BalanceVault

BalanceVault is a secure financial ledger foundation built with a React/Vite frontend, an Express REST API, and PostgreSQL. Monetary amounts will be represented in integer paise and financial operations will be handled only by the backend.

## Requirements

- Node.js 24 or compatible supported release
- npm
- PostgreSQL (needed when database features are added)

## Local setup

```sh
npm install
cp .env.example .env
npm run dev
```

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:3001`. The landing page reports whether `GET /api/health` is reachable. You can run either app independently with `npm run dev:web` or `npm run dev:api`.

## Useful commands

```sh
npm run build
npm test
npm run db:generate
npm run db:migrate
npm run db:studio
```

Database commands require a local `DATABASE_URL` and a Prisma schema, which have not been added yet. Never commit `.env` or real credentials.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the planned application boundaries and financial integrity approach.
