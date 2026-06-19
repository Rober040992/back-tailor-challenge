## Spec: Authentication

**Endpoint(s):**

```txt
POST /auth/login
POST /auth/logout
```

**Input:**

`POST /auth/login`

```json
{
  "username": "string",
  "password": "string"
}
```

`POST /auth/logout`

No body required.

**Output:**

Successful login returns `200 OK`, sets the authentication cookie, and returns the authenticated user.

```json
{
  "id": 1,
  "username": "steve"
}
```

Successful logout returns `204 No Content` and clears the authentication cookie.

**Cookie:**

```txt
Name: access_token
Type: HttpOnly
Expiration: 24 hours
```

**Business rules:**

* Login must validate the user against the seeded users stored in the database.
* JWT must be generated only after a valid username and password.
* JWT payload must include the authenticated user id and username.
* The login response must never expose `passwordHash`.
* Logout must clear the authentication cookie.
* Registration is out of scope.

**Edge cases:**

* Missing username or password returns `400 Bad Request`.
* Invalid credentials return `401 Unauthorized`.
* Invalid credentials must not reveal whether the username or password failed.
* Logout without a valid authenticated session returns `401 Unauthorized`.
