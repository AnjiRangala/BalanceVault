# BalanceVault API

All protected endpoints require `Authorization: Bearer <access-token>`. The API verifies the token and reloads the active user's current role from PostgreSQL. The user ID and role in request bodies, query parameters, and path parameters never establish identity. Amounts are INR paise represented as decimal integer strings where returned.

## Account statement

`GET /api/accounts/{accountId}/statement?limit=25&cursor={opaqueCursor}`

Returns a page for one customer account. An administrator can read customer accounts. An account holder or auditor must have `AccountPermission.canView=true` for that account. Internal clearing accounts are never returned. An inaccessible or unknown account returns `404`.

`limit` is optional and defaults to 25; allowed values are integers from 1 through 100. `cursor` is the opaque `nextCursor` returned by the previous page. Ledger rows use `accountPostingSequence` as their authoritative running-balance order. The statement query runs in a PostgreSQL `REPEATABLE READ` transaction so its account authorization and event page use one database snapshot.

Example:

```json
{
  "account": {
    "id": "d7299992-533e-4438-b76a-f488d88ab997",
    "accountNumber": "BV-10021",
    "type": "PERSONAL",
    "currencyCode": "INR"
  },
  "events": [
    {
      "id": "08ec5f76-4bd4-4cec-a8b3-23a38ce55808",
      "type": "DEPOSIT",
      "amountPaise": "125000",
      "status": "POSTED",
      "timestamp": "2026-11-07T10:30:00.000Z",
      "reference": null,
      "actor": { "id": "581f1383-b2c6-4254-9a06-16c2ded715fc", "role": "ADMIN" },
      "runningBalancePaise": "125000"
    },
    {
      "id": "a2dd2ced-6dfa-4dce-b470-f1bf90f14921",
      "type": "WITHDRAWAL",
      "amountPaise": "200000",
      "status": "REFUSED",
      "timestamp": "2026-11-07T10:35:00.000Z",
      "reference": "a2dd2ced-6dfa-4dce-b470-f1bf90f14921",
      "actor": { "id": "581f1383-b2c6-4254-9a06-16c2ded715fc", "role": "ADMIN" },
      "runningBalancePaise": "125000",
      "refusalReason": "insufficient_funds"
    }
  ],
  "nextCursor": null
}
```

Posted entries have signed `amountPaise`: credits are positive and debits negative. Refused attempts show their requested positive amount, a refusal reason, and an unchanged running balance. Their reference is the attempt ID because refused attempts have no journal reference.

Each page uses one repeatable-read snapshot. The current `TransactionAttempt` schema has no per-account posting sequence; refused-attempt placement is inferred from its `createdAt` relative to ledger rows. Since PostgreSQL's default timestamp is the transaction start time, a request delayed on a lock can have an attempt timestamp earlier than the moment it was actually refused. The immutable ledger-entry running balances remain ordered by `accountPostingSequence`.

Invalid account IDs, limits, or cursors return `400`; missing authentication returns `401`; inaccessible accounts return `404`. Database failures return a generic `500` response.

## Audit events

`GET /api/audit?page=1&perPage=25`

ADMIN only. Returns immutable audit records ordered by timestamp and ID, newest first. `page` starts at 1. `perPage` defaults to 25 and must be 1 through 100. Actor details contain only ID, email, and current role. Metadata keys associated with credentials, hashes, database connections, or SQL are redacted.

Example:

```json
{
  "events": [
    {
      "id": "e05ba07c-7652-4222-a7bc-8261e19e6001",
      "action": "TRANSACTION_REFUSED",
      "entityType": "TransactionAttempt",
      "entityId": "a2dd2ced-6dfa-4dce-b470-f1bf90f14921",
      "metadata": { "reason": "insufficient_funds", "type": "WITHDRAWAL" },
      "createdAt": "2026-11-07T10:35:00.000Z",
      "actor": {
        "id": "581f1383-b2c6-4254-9a06-16c2ded715fc",
        "email": "admin@example.test",
        "role": "ADMIN"
      }
    }
  ],
  "page": 1,
  "perPage": 25,
  "hasMore": false
}
```

Invalid pagination returns `400`, missing authentication returns `401`, and non-admin callers receive `403`.
