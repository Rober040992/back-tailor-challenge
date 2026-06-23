## Spec: Current Authenticated User

**Endpoint:**

```txt
GET /auth/me
```

**Authentication:**

The endpoint requires a valid JWT from the existing HttpOnly `access_token` cookie.

**Output:**

Successful authentication returns `200 OK`.

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "roberto"
}
```

**Business rules:**

- Return only the authenticated user's `id`, `email` and `username`.
- Do not change the existing JWT payload or login response.
- Do not expose `passwordHash`.

**Edge cases:**

- A missing, invalid or expired authentication cookie returns `401 Unauthorized`.
- Errors use the existing global backend error format.

**Tests:**

- Returns `200 OK` with a valid authentication cookie.
- Returns `401 Unauthorized` without a valid authentication cookie.
