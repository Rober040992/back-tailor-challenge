# Restaurant Reservation API

## Project overview

This repository contains the backend REST API for a restaurant reservation application. It is built with NestJS and TypeScript, uses PostgreSQL through Prisma ORM, and authenticates users with JWTs stored in HttpOnly cookies.

The current implementation includes authentication, restaurant CRUD, on-demand availability, reservations, favourites, comments, centralized logging, shared API error handling, Prisma models, and reproducible local seed data.

> [!NOTE]
> For all implemented routes, request bodies, responses, validation rules, and Postman instructions, see the [Postman Endpoint Guide](./POSTMAN_ENDPOINTS_GUIDE.md).

## Current feature status

| Feature          | Status      | Current state                                                                                                               |
| ---------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| Authentication   | Implemented | Registration, login, current authenticated user, JWT cookie authentication, protected routes, and logout                    |
| Restaurants CRUD | Implemented | Public reads and authenticated create, update, and delete                                                                   |
| Availability     | Implemented | Public, on-demand slot calculation using settings, booked slots, and confirmed reservations                                 |
| Reservations     | Implemented | Authenticated creation, owned list and detail, cancellation, and transactional capacity enforcement                         |
| Favourites       | Implemented | Authenticated add, owned list, and remove operations                                                                        |
| Comments         | Implemented | Public listing and authenticated create, owned update, and owned delete operations                                          |
| Error handling   | Implemented | Global exception filter and structured validation details                                                                   |
| Logging          | Implemented | Centralized HTTP, error, and important domain action logs                                                                   |
| Database seed    | Implemented | Reproducible restaurant, comment, and user seed                                                                             |
| Tests            | Implemented | Authentication, restaurants, availability, reservations, favourites, comments, and Swagger have service and/or e2e coverage |
| Swagger          | Implemented | Local Swagger UI and OpenAPI JSON with production opt-in                                                                    |

## Tech stack

- NestJS 11 and TypeScript
- PostgreSQL
- Prisma ORM 7 with the PostgreSQL driver adapter
- Passport and `passport-jwt`
- JWT authentication through `@nestjs/jwt`
- HttpOnly cookies through `cookie-parser`
- `bcrypt` password hashing
- `class-validator` and `class-transformer`
- `@nestjs/swagger` for OpenAPI documentation
- Jest and Supertest
- ESLint and Prettier
- npm

## Architecture

The backend follows this layered flow:

```txt
HTTP -> Controller -> Service -> Repository -> Database
```

- Controllers define HTTP routes, status codes, guards, and validated DTO inputs.
- DTOs define accepted request fields and validation rules.
- Services contain application and business logic.
- Repositories isolate Prisma queries.
- `PrismaService` configures and owns database access.

## Project structure

```txt
.
|-- docs/
|   `-- specs/
|-- prisma/
|   |-- migrations/
|   |-- seed-data/
|   |-- schema.prisma
|   `-- seed.ts
|-- src/
|   |-- availability/
|   |   `-- dto/
|   |-- auth/
|   |   |-- dto/
|   |   `-- jwt/
|   |-- comments/
|   |   `-- dto/
|   |-- common/
|   |   |-- errors/
|   |   `-- filters/
|   |-- favourites/
|   |   `-- dto/
|   |-- prisma/
|   |-- reservations/
|   |   `-- dto/
|   |-- restaurants/
|   |   `-- dto/
|   |-- app.module.ts
|   |-- app.setup.ts
|   `-- main.ts
|-- test/
|-- .env.example
|-- constitution.back.md
|-- package.json
|-- POSTMAN_ENDPOINTS_GUIDE.md
`-- prisma.config.ts
```

## Requirements

- A current Node.js version compatible with the dependencies in `package.json`
- npm
- A local PostgreSQL database

## Environment variables

Copy `.env.example` to `.env` and replace the placeholders:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME_HERE?schema=public"
JWT_SECRET="replace-with-a-safe-local-secret"
PORT=3000
SWAGGER_ENABLED=false
```

> [!IMPORTANT]
> `DATABASE_URL` and `JWT_SECRET` are required. `PORT` is optional and defaults to `3000`. Swagger is always enabled outside production. In production, set `SWAGGER_ENABLED=true` to expose it.

Do not commit `.env` or real credentials.

## Database setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local PostgreSQL database.

3. Copy `.env.example` to `.env` and configure `DATABASE_URL` and `JWT_SECRET`.

4. Generate Prisma Client:

   ```bash
   npx prisma generate
   ```

5. Apply the existing migrations:

   ```bash
   npx prisma migrate dev
   ```

6. Seed the database:

   ```bash
   npm run seed
   ```

> [!WARNING]
> The seed deletes the existing local favourites, comments, reservations, restaurants, and users before recreating the sample dataset. Do not run it against a database containing data you need to keep.

## Running the app locally

Start the API in watch mode:

```bash
npm run start:dev
```

> [!TIP]
> Use `npm run start:dev` during development so NestJS automatically restarts when source files change.

By default, the API is available at:

```txt
http://localhost:3000
```

Swagger documentation is available locally at:

```txt
http://localhost:3000/docs
http://localhost:3000/docs-json
```

Other available scripts include:

```bash
npm run start
npm run start:debug
npm run build
npm run start:prod
```

Run `npm run build` before `npm run start:prod`.

## Tests and quality checks

```bash
npm run lint
npm run test
npm run test:e2e
npm run test:cov
npm run build
```

The e2e tests use the configured PostgreSQL database and expect the seed users and restaurant data to be available.

> [!CAUTION]
> `npm run lint` uses ESLint's automatic fix mode and may modify source or test files.

## Authentication and sample credentials

Authentication uses a JWT stored in the `access_token` HttpOnly cookie. Tokens expire after 24 hours, are not stored in the database, and are cleared on logout. Registration creates a user account without creating a JWT or authentication cookie.

> [!CAUTION]
> The local cookie uses `SameSite=Lax` and `Secure=false`. This configuration is intended for local HTTP development and must not be used unchanged in production.

The seed creates four users with password `12345`:

```txt
roberto@example.com / roberto
lautaro@example.com / lautaro
nico@example.com / nico
aida@example.com / aida
```

Passwords are hashed with `bcrypt`. After login, Postman keeps the HttpOnly `access_token` cookie in its cookie jar. Use the same Postman session to call `GET /auth/me` and verify the current authenticated user:

```json
{
  "id": 1,
  "email": "roberto@example.com",
  "username": "roberto"
}
```

See the [Postman Endpoint Guide](./POSTMAN_ENDPOINTS_GUIDE.md) for registration, login, current-user checks, logout, endpoint access, request bodies, and responses.

## Error format

The global exception filter returns one shared shape:

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed.",
  "path": "/restaurants",
  "timestamp": "2026-06-20T18:30:00.000Z",
  "details": [
    {
      "field": "capacity",
      "message": "capacity must not be less than 1"
    }
  ]
}
```

`details` is included when supplied by the exception, including DTO validation failures. Unexpected errors are logged server-side and returned as a generic `500 Internal Server Error` response.

## Logging

The API uses the built-in NestJS `Logger` and writes logs to the local terminal.

```txt
[HTTP] POST /reservations 201 42ms userId=1
[RESERVATION] created reservationId=12 restaurantId=1 userId=1 date=2026-07-10 time=13:30 partySize=4
[ERROR] POST /reservations 409 The selected slot no longer has enough capacity.
```

HTTP logs include the method, path, status, duration, and authenticated user when available. Domain logs cover authentication, restaurant mutations, availability checks, reservation actions, favourite changes, and comment mutations. Passwords, JWTs, cookies, authorization headers, and request bodies are never logged.

## Main business rules

- Restaurant ratings are calculated from comments and are not stored as mutable fields.
- Restaurant mutations require authentication; no admin role exists for the MVP.
- Restaurants with related comments, favourites, or reservations cannot be deleted.
- Availability is generated on demand from service windows, slot capacity, seeded booked slots, and confirmed reservations.
- Cancelled reservations release capacity and do not reduce availability.
- Reservation creation recalculates availability inside a serializable transaction.
- Reservations belong to users, cannot be created in the past, and must use generated restaurant slots.
- Users can list, read, and cancel only their own reservations.
- Favourites belong to users, cannot be duplicated, and removing one does not delete the restaurant.
- Comments use the authenticated user as author; only authors can update or delete them.
- Initial service windows and booked slots remain inside `Restaurant.reservationSettings`.

## Technical decisions and trade-offs

- The backend is maintained as a separate repository and implemented before frontend integration.
- Local development uses PostgreSQL.
- Database changes use Prisma migrations, and initial data uses a reproducible Prisma seed.
- Authentication uses a JWT in an HttpOnly cookie instead of database token storage.
- Registration is public and does not authenticate the newly created user automatically.
- The application uses a direct controller/service/repository structure without additional architectural layers.
- Reservation creation uses a repository-managed serializable transaction while availability rules remain in the service layer.
- Availability and Reservations share slot calculation without coupling their services.
- Any authenticated user can mutate restaurants for the MVP; no admin role exists.
- Swagger is available locally and can be explicitly enabled in production.
- Docker remains an optional final improvement.

## AI usage notes

AI/Codex was used as an implementation assistant for specifications, prompts, planning, documentation, and implementation support. The developer reviewed the resulting code, API contracts, errors, and business rules.

Generated output was checked against `constitution.back.md`, the active specifications, and the repository source. Invented endpoints, unrelated refactors, overengineering, payments, admin roles, and premature Docker or Swagger work were rejected or avoided.

## Current limitations

- The e2e tests depend on a configured and seeded local database.
- Frontend integration is not included in this repository.
- The local authentication cookie is not configured for HTTPS production use.
- Swagger is disabled by default when `NODE_ENV=production`.
- Docker configuration is not available.
- Production deployment configuration is not included.

## Local verification flow

1. Install dependencies with `npm install`.
2. Create the PostgreSQL database.
3. Copy `.env.example` to `.env` and configure its values.
4. Run `npx prisma generate`.
5. Run `npx prisma migrate dev`.
6. Run `npm run seed`.
7. Start the API with `npm run start:dev`.
8. Call `POST /auth/login` using a sample user.
9. Call `GET /auth/me` in the same Postman session to verify the authenticated user.
10. Call `GET /restaurants` and `GET /restaurants/1`.
11. Call `GET /restaurants/1/availability?date=2026-07-10&partySize=4`.
12. Verify that booked slots reduce `availableSeats` and that the response includes unavailable slots.
13. Create a reservation with authenticated `POST /reservations`.
14. List it with `GET /me/reservations`.
15. Read it with `GET /reservations/:reservationId`.
16. Cancel it with `PATCH /reservations/:reservationId/cancel`.
17. Verify that the cancelled reservation no longer reduces availability.
18. Add a favourite with `POST /me/favourites/:restaurantId`.
19. List it with `GET /me/favourites`.
20. Remove it with `DELETE /me/favourites/:restaurantId`.
21. List restaurant comments with `GET /restaurants/:restaurantId/comments`.
22. Create a comment with authenticated `POST /restaurants/:restaurantId/comments`.
23. Update it with `PATCH /comments/:commentId`.
24. Delete it with `DELETE /comments/:commentId`.
25. Create a restaurant with authenticated `POST /restaurants`.
26. Update it with authenticated `PATCH /restaurants/:id`.
27. Delete it with authenticated `DELETE /restaurants/:id`.
28. Call `POST /auth/logout`.
29. Run `npm run test`, `npm run test:e2e`, and `npm run build`.

If `GET /auth/me` returns `404 Cannot GET /auth/me`, the running server has not loaded the current source. Restart `npm run start:dev`, or run `npm run build` before `npm run start:prod`, and confirm no older backend process is using port `3000`.

---

## Author note

Built by Roberto Gomez Fabrega as part of a technical challenge, with a focus on clean backend architecture, clear business rules, and maintainable API design.
