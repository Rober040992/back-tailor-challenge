# AGENTS.md

## Project Role

You are the implementation assistant for the backend repository.

Your job is to help implement a NestJS REST API for a restaurant reservation app.

You must work from approved specs only.

You must keep the backend simple, clear and maintainable.

## Source of Truth

Follow this hierarchy

1. `constitution.back.md`
2. Feature specs in `docs/specs`
3. This `AGENTS.md`
4. The current Codex task prompt
5. Implementation

If there is any conflict, the higher-level document wins.

If something is unclear, stop and ask before changing code.

## Mandatory Workflow

For every backend task

1. Read `constitution.back.md`.
2. Read the related spec in `docs/specs`.
3. Propose a short implementation plan.
4. List the affected layers.
5. Wait for approval.
6. Implement only the approved scope.
7. Add or update relevant tests.
8. Review the result against the spec.

Never skip directly from task request to implementation.

## Planning Rules

Before implementing, always explain

- Which feature is being changed.
- Which files or layers are affected.
- Whether database changes are needed.
- Whether tests are needed.
- Any risk or unclear point.

Keep the plan short.

## Backend Architecture Rules

Use this layered architecture

```txt
HTTP - Controller - Service - Repository - Database
```

Responsibilities

- Controllers handle HTTP and delegate.
- DTOs validate input.
- Services contain business logic.
- Repositories contain Prisma queries.
- PrismaService owns database access.

Rules

- Do not call Prisma directly from controllers.
- Do not call Prisma directly from services.
- Do not put business logic inside repositories.
- Do not put business logic inside controllers.
- Do not introduce use cases, ports, adapters or hexagonal architecture unless explicitly approved.

## File Scope Rules

You may create new files only inside the approved feature scope.

You may modify existing files only when required by the approved spec.

Do not rewrite unrelated files.

Do not refactor unrelated code.

Do not rename files unless the spec asks for it.

Do not change public API contracts unless the spec explicitly requires it.

## Backend Stack Rules

Use

- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT authentication
- HttpOnly cookies
- npm

Do not add extra libraries unless they are necessary and approved.

Swagger and Docker are optional final improvements only.

## Database Rules

- Prisma schema is the source of truth for the database.
- Do not create tables manually.
- Use Prisma migrations for database changes.
- Use Prisma seed for initial data.
- Do not mutate the original restaurant seed for new reservations.
- Store user-created reservations in the `Reservation` model.
- Keep initial booked slots inside `Restaurant.reservationSettings.bookedSlots`.

Do not create extra database tables for `reservationSettings`, `serviceWindows` or `bookedSlots`.
They must remain inside `Restaurant.reservationSettings` as JSON.

## Authentication Rules

- JWT is created only after successful login.
- JWT is stored in an HttpOnly cookie.
- JWT expires after 24 hours.
- JWT tokens are not stored in the database.
- Protected endpoints must read the authenticated user from the JWT.
- Logout clears the authentication cookie.
- Registration is out of scope unless explicitly approved.

## Authorization Rules

Apply ownership checks consistently.

Rules

- Users can only manage their own favourites.
- Users can only list their own reservations.
- Users can only read their own reservation details.
- Users can only cancel their own reservations.
- Only comment authors can edit comments.
- Only comment authors can delete comments.

Use

- `401 Unauthorized` when the user is not authenticated.
- `403 Forbidden` when the user is authenticated but does not own the resource.
- `404 Not Found` when the resource does not exist.

## Error Rules

All API errors must follow the shared error format from `constitution.back.md`.

Use consistent status codes

- `200 OK` for successful reads and updates with response body.
- `201 Created` for successful creations.
- `204 No Content` for successful deletes without response body.
- `400 Bad Request` for invalid input.
- `401 Unauthorized` for missing or invalid JWT.
- `403 Forbidden` for failed ownership checks.
- `404 Not Found` for missing resources.
- `409 Conflict` for overbooking, duplicated favourites or invalid state conflicts.
- `500 Internal Server Error` for unexpected errors.

Do not create different error shapes per module.

## Business Rule Rules

Never trust the frontend as the source of truth.

Reservation and availability rules must be enforced server-side.

Always recalculate availability before creating a reservation.

Do not allow

- Reservations in the past.
- Party size less than or equal to zero.
- Reservation times outside generated slots.
- Reservations exceeding available seats.
- Cancelling an already cancelled reservation.

## Testing Rules

Focus tests on logic that can break silently.

Required test focus

- Availability calculation.
- Reservation creation.
- Reservation cancellation.
- Auth-protected endpoints.
- Ownership rules.

Do not test every trivial endpoint unless it protects business logic.

## Commands

Use npm.

Commands are project-dependent and must be confirmed from `package.json`.

Expected commands

```txt
npm run lint
npm run test
npm run test:e2e
npm run build
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

If a command does not exist, do not invent it. Check `package.json` first.

## Review Checklist

Before finishing a backend task, check

- The implementation follows the approved spec.
- The implementation follows `constitution.back.md`.
- No unrelated files were changed.
- No unapproved feature was added.
- No Prisma call exists in controllers or services.
- DTO validation is present where needed.
- Error responses follow the shared format.
- Ownership rules are respected.
- Relevant tests were added or updated.
- The code is simple and readable.

## Stop Conditions

Stop and ask before implementing if

- The spec is missing.
- The spec conflicts with `constitution.back.md`.
- The task requires changing an API contract.
- The task requires changing database models unexpectedly.
- The task requires adding a new dependency.
- The task touches unrelated features.
- The business rule is unclear.
- The requested change contradicts the constitution.

## Forbidden Actions

Do not

- Invent features.
- Invent endpoints.
- Invent database fields.
- Invent business rules.
- Modify unrelated files.
- Rewrite large files without approval.
- Add registration unless approved.
- Add payments.
- Add admin roles.
- Add WebSockets.
- Add multi-tenant logic.
- Add Docker before the core flow works.
- Add Swagger before the core backend is complete.