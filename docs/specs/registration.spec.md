## Spec: Auth Registration

**Goal:**

Allow a new user to create an account with `email`, `username` and `password`.

Registration creates the user but does not authenticate the user automatically.

**Endpoint(s):**

```txt
POST /auth/register
```

**Input:**

Body:

```json
{
  "email": "user@example.com",
  "username": "roberto",
  "password": "Password123"
}
```

**Output:**

Success response:

```txt
201 Created
```

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "roberto",
  "createdAt": "2026-06-22T10:00:00.000Z",
  "updatedAt": "2026-06-22T10:00:00.000Z"
}
```

**Business rules:**

* Registration is public.
* Registration requires `email`, `username` and `password`.
* `email` must be unique.
* `username` must be unique.
* `password` must be hashed before saving the user.
* Registration must not return `passwordHash`.
* Registration must not generate a JWT.
* Registration must not set the authentication cookie.
* Existing login behavior must not change.
* Seed users must include `email`.

**Validation:**

* `email` must be a valid email.
* `username` must be a non-empty string.
* `password` must be a non-empty string.
* Duplicated `email` must return `409 Conflict`.
* Duplicated `username` must return `409 Conflict`.

**Edge cases:**

* Missing `email` returns `400 Bad Request`.
* Missing `username` returns `400 Bad Request`.
* Missing `password` returns `400 Bad Request`.
* Invalid `email` format returns `400 Bad Request`.
* Existing `email` returns `409 Conflict`.
* Existing `username` returns `409 Conflict`.

**Tests:**

* Creates a user with valid `email`, `username` and `password`.
* Stores the password as `passwordHash`, not plain text.
* Does not return `passwordHash`.
* Returns `409 Conflict` when `email` already exists.
* Returns `409 Conflict` when `username` already exists.
* Does not set authentication cookie after registration.
* Existing login tests remain valid.
