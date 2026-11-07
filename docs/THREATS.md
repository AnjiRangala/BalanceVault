# BalanceVault threat model

## Assets

- Customer money balances, ledger entries, transaction history, and account permissions.
- Customer identity data and password hashes.
- JWT signing secret, actor assertion HMAC key, database credentials, and Redis credentials.
- Privileged roles, account-opening decisions, and audit records.
- Availability and consistency of the API, PostgreSQL, and Redis services.

## Trust boundaries

1. The browser is untrusted. All request fields, URLs, and client-held tokens can be modified or replayed.
2. The Express API verifies bearer tokens, current user state, input shape, and route roles, but does not own financial balances.
3. PostgreSQL functions enforce posting, locking, idempotency, ownership, and protected provisioning rules.
4. The migration and database administrator environment is highly trusted and separate from the API runtime.
5. `AUTH_DATABASE_URL` is isolated from ordinary runtime queries and can read password hashes only for authentication.
6. Redis is a required shared dependency for login and registration rate limits.

## Threat actors and attack surfaces

Threat actors include unauthenticated internet clients, compromised customer or staff accounts, malicious insiders with limited database access, and attackers who obtain application or infrastructure secrets. Attack surfaces include REST endpoints, browser storage, JWT handling, public registration and invitation acceptance, financial retries, PostgreSQL function grants, migration jobs, and operational secrets.

## Threats and mitigations

| Threat | Mitigations |
| --- | --- |
| Credential guessing or account enumeration | bcrypt password hashing; generic login failures; shared Redis rate limits; registration and login input validation. |
| Stolen or forged identity/role claims | Short-lived signed JWTs with fixed issuer and audience; API ignores caller-supplied user and role; each request rechecks active state and token version. |
| Unauthorized account access | Backend checks account assignment and capability; account IDs supplied by a client do not grant access; auditor views are account scoped. |
| Financial tampering or overdraft | PostgreSQL posting functions own all money movement; integer paise; row locking; no runtime table writes; no overdrafts; balanced journal constraints and immutable ledger triggers. |
| Duplicate, conflicting, or concurrent financial requests | Unique idempotency keys, payload fingerprints, atomic posting, and adversarial concurrency tests. |
| Privilege escalation through registration or invitation | Public registration creates only account holders; first administrator uses an isolated one-time operator function; later privileged roles require admin-issued expiring, revocable invitations. |
| Forged or replayed privileged operation | HMAC binds actor, action, time, nonce, and arguments; PostgreSQL checks expiry and consumes the nonce atomically; runtime cannot call legacy UUID-only wrappers. |
| Database privilege escalation or password-hash disclosure | Separate migration/function/runtime/auth/bootstrap identities; PUBLIC execution revoked for privileged functions; pinned SECURITY DEFINER search paths; auth hash access is column scoped. |
| SQL injection | Prisma parameterized calls and queries; dynamic SQL is avoided for request values; Zod validation rejects unexpected fields on sensitive endpoints. |
| Browser script injection or clickjacking | React's normal text escaping, JSON APIs, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`. No user-supplied HTML rendering is part of the current workflow. |
| Cross-origin abuse | CORS allows only configured exact origins. The API uses bearer headers rather than ambient cookies, so classic cookie-based CSRF does not apply. |
| Sensitive data exposure in logs or responses | Generic server errors; no password hashes or token hashes in API responses; invitation token is returned once with `Cache-Control: no-store`; operational URLs/secrets are not logged. |
| Service denial or dependency failure | Request size limit, bounded database readiness checks, rate limits, database pool bounds, and fail-closed behavior when Redis is unavailable. |

## Residual risks

- A compromised API process can act with runtime privileges and can sign actor assertions if it can read the assertion key. Keep API secrets in a managed secret store, restrict host access, rotate through a coordinated procedure, and monitor privileged audit events.
- A database superuser or migration credential can alter schema, roles, data, and audit evidence. Restrict access, require reviewed changes, and retain encrypted backups outside the database account.
- Browser bearer tokens are exposed to successful same-origin script injection. See `docs/FRONTEND.md` for the current storage strategy; deploy a restrictive frontend content policy and prevent untrusted script execution.
- Authentication depends on Redis availability. A Redis outage causes login and registration to fail closed.
- Invitation email delivery, anomaly alerts, automated reconciliation scheduling, and production restore exercises are operational integrations that are not implemented in this repository.
- No independent security audit or production penetration test is represented by the repository test results.
