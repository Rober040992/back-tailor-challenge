## Spec: Swagger API Documentation

**Goal:**

Expose a Swagger/OpenAPI documentation page for the existing backend API so reviewers can inspect and manually test all implemented endpoints.

**Endpoint(s):**

```txt
GET /docs
GET /docs-json
```

Both documentation endpoints are public.

**Input:**

No request body.

Swagger must document the existing path params, query params and DTO request bodies used by the current controllers.
Swagger must document the existing response DTOs and HTTP status codes where available.

**Output:**

A Swagger UI page showing all existing backend endpoints grouped by feature tags:

```txt
auth
restaurants
availability
reservations
favourites
comments
```

**Business rules:**

Swagger must not change any existing endpoint, DTO, validation rule, service, repository, Prisma model or business logic.

Adding `@nestjs/swagger` is approved for this feature.

Swagger must document cookie authentication using the existing `access_token` HttpOnly cookie.

Private endpoints must be marked as requiring cookie authentication.

Swagger examples must not contain real credentials, JWT values or sensitive cookie contents.

Swagger must be enabled locally.

Swagger must be prepared for production use through a `SWAGGER_ENABLED` environment variable and must be disabled by default in production.

**Validation:**

No new runtime validation is required.

Existing DTO validation must remain unchanged.

**Edge cases:**

Swagger setup must not break app bootstrap.

Swagger setup must not break lint, build or tests.

All implemented backend endpoints must be visible in `/docs`.

Swagger must stay as a documentation layer only.

**Tests:**

No business unit tests are required.

Add a smoke test confirming that `GET /docs` returns `200 OK` when Swagger is enabled.

Run the existing available validation commands from `package.json`, especially lint and build.
