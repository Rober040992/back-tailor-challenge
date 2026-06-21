# Spec: Backend Logging

**Goal:**

Add a simple, clean and non-invasive logging system for the backend MVP.

The system must improve local terminal traceability without adding heavy observability tools, external logging dependencies or unnecessary infrastructure.

Logging must help understand:

- Which HTTP requests are received.
- Which HTTP responses are returned.
- How long each request takes.
- Which authenticated user triggered a request, when available.
- Which important domain actions happened.
- Which controlled or unexpected errors occurred.

The logging system must stay centralized where possible and must not pollute controllers with logging logic.

**Endpoint(s):**

No new endpoints.

Logging applies to the existing backend API.

**Input:**

No API input changes.

The logging system may read request metadata:

    method
    path
    statusCode
    duration
    authenticated user id, when available

The logging system must not log sensitive data:

    passwords
    password hashes
    cookies
    JWTs
    raw request bodies
    authorization headers

**Output:**

No API response shape changes.

Logs must be written to the terminal using a readable and consistent format.

Expected HTTP log format:

    [HTTP] POST /reservations 201 42ms userId=1

For anonymous requests:

    [HTTP] GET /restaurants 200 18ms userId=anonymous

Expected domain log format:

    [RESERVATION] created reservationId=12 restaurantId=1 userId=1 date=2026-07-10 time=13:30 partySize=4

Expected error log format:

    [ERROR] POST /reservations 409 Capacity conflict

For unexpected server errors, stack traces may be logged locally.

**Business rules:**

- Use the built-in NestJS `Logger`.
- Do not add external logging dependencies.
- Do not add database tables for logs.
- Do not create log files.
- Do not change existing API contracts.
- Do not change existing response bodies.
- Do not change the existing global error response format.
- HTTP request logging must be centralized.
- Error logging must reuse the existing global exception flow.
- Domain logs must be added only for important MVP actions.
- Controllers must not contain logging logic unless there is no cleaner option.
- Services may log relevant domain actions when the action belongs to their business flow.
- Repositories must not contain logging unless needed to trace an unexpected persistence failure.
- Logging must never break an API request.

Important domain actions to log:

- Successful login.
- Failed login.
- Logout.
- Restaurant created.
- Restaurant updated.
- Restaurant deleted.
- Availability checked.
- Reservation created.
- Reservation cancelled.
- Reservation capacity conflict.
- Favourite added.
- Favourite removed.
- Comment created.
- Comment updated.
- Comment deleted.

Domain logs must include only useful identifiers and safe metadata.

Examples:

    [AUTH] login success userId=1 username=roberto
    [AUTH] login failed username=roberto
    [AUTH] logout userId=1
    [RESTAURANT] created restaurantId=12 userId=1
    [AVAILABILITY] checked restaurantId=1 date=2026-07-10 partySize=4
    [RESERVATION] capacity conflict restaurantId=1 date=2026-07-10 time=13:30 partySize=6 availableSeats=2 userId=1

**Validation:**

No new request validation is required.

The logger must safely handle:

- Anonymous requests.
- Authenticated requests.
- Successful responses.
- Controlled HTTP errors.
- Unexpected server errors.
- Requests without user data.
- Requests that fail before reaching a controller.

The logger must not throw if user information is missing.

The logger must not throw if response information is missing.

**Edge cases:**

- If there is no authenticated user, use `userId=anonymous`.
- 4xx errors must be logged without stack traces.
- 5xx errors may include stack traces for local debugging.
- Sensitive data must never appear in logs.
- Logging must not duplicate the same HTTP request log multiple times.
- Domain logs must not be added for every internal method call.
- Domain logs must focus on actions that help trace MVP flows.
- Logging must not introduce meaningful latency for this MVP.
