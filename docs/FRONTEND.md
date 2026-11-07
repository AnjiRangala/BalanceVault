# Frontend authentication and dashboard

The web app uses `VITE_API_BASE_URL` to call the existing API. It provides `/login`, `/register`, `/dashboard`, `/accounts`, `/accounts/:id`, and an administrator-only `/audit` presentation. The account list loads the permitted accounts and fetches each balance from its account balance endpoint. Account detail loads both the account and balance endpoints. Display formatting converts paise with `BigInt` quotient/remainder arithmetic, avoiding floating-point conversion. Account balances and transaction activity are not fabricated; activity stays in an empty state until a ledger activity endpoint is connected to the interface.

Administrators see an account creation form that submits to the existing `POST /api/accounts` function. The database and API enforce administrator authorization and validate the holder. A selected account is held in frontend authentication context for future transaction forms; this value is only a UI convenience and does not authorize API access. Account creation refreshes the account list. Future successful money movement actions should call the shared `refreshAccounts()` context action to refresh account views.

## Session storage

For this hackathon SPA, the access token, safe user response, and calculated expiry are stored in `sessionStorage`. This keeps a login across reloads in the same tab and clears it when that tab's session ends. The interface clears the session when the stored expiry is reached on initialization or when an API request returns `401`.

`sessionStorage` is readable by JavaScript running on the page. A cross-site scripting flaw could steal the access token. It is not equivalent to an `HttpOnly`, `Secure`, `SameSite` cookie and has no automatic CSRF protection tradeoff. Do not store financial credentials or long-lived refresh tokens there. A production session should move to a server-managed `HttpOnly`, `Secure`, `SameSite` cookie design with appropriate CSRF controls.

The stored role is used only to show or hide navigation. A browser user can change their local storage values, so the backend must remain responsible for every authentication and authorization decision. API requests send the bearer token, and the backend reloads the current active user and role from PostgreSQL.

## Local setup

Set `VITE_API_BASE_URL` to the API origin (for example `http://localhost:3001`) in the root `.env`. Vite exposes only variables with the `VITE_` prefix. Start both apps with `npm run dev`, or start them separately with `npm run dev:api` and `npm run dev:web`.

Registration currently collects the name required by the API contract. The current backend `User` schema does not persist a name, so the dashboard uses the account email for its welcome text.
