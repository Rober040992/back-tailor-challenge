# Restaurant Reservation API

## Project overview

This repository contains the backend REST API for a restaurant reservation application. It is built with NestJS and TypeScript, uses PostgreSQL through Prisma ORM, and authenticates users with JWTs stored in HttpOnly cookies.

The current implementation includes authentication, restaurant CRUD, on-demand availability, reservations, favourites, comments, centralized logging, shared API error handling, Prisma models, and reproducible local seed data.

## Current feature status

| Feature | Status | Current state |
| --- | --- | --- |
| Authentication | Implemented | Login, JWT cookie authentication, protected routes, and logout |
| Restaurants CRUD | Implemented | Public reads and authenticated create, update, and delete |
| Availability | Implemented | Public, on-demand slot calculation using settings, booked slots, and confirmed reservations |
| Reservations | Implemented | Authenticated creation, owned list and detail, cancellation, and transactional capacity enforcement |
| Favourites | Implemented | Authenticated add, owned list, and remove operations |
| Comments | Implemented | Public listing and authenticated create, owned update, and owned delete operations |
| Error handling | Implemented | Global exception filter and structured validation details |
| Logging | Implemented | Centralized HTTP, error, and important domain action logs |
| Database seed | Implemented | Reproducible restaurant, comment, and user seed |
| Tests | Implemented | Authentication, restaurants, availability, reservations, favourites, and comments have service and/or e2e coverage |

## Tech stack

- NestJS 11 and TypeScript
- PostgreSQL
- Prisma ORM 7 with the PostgreSQL driver adapter
- Passport and `passport-jwt`
- JWT authentication through `@nestjs/jwt`
- HttpOnly cookies through `cookie-parser`
- `bcrypt` password hashing
- `class-validator` and `class-transformer`
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
```

`DATABASE_URL` and `JWT_SECRET` are required. `PORT` is optional and defaults to `3000`.

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

The seed clears the local records covered by the seed and recreates four users, ten restaurants, and their supplied comments. It is intended for local development.

## Running the app locally

Start the API in watch mode:

```bash
npm run start:dev
```

By default, the API is available at:

```txt
http://localhost:3000
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

Note that `npm run lint` uses ESLint's automatic fix mode and may modify files.

## Authentication

`POST /auth/login` validates a seeded username and password. After successful validation, the API signs a JWT containing the user's ID and username and returns the public user:

```json
{
  "id": 1,
  "username": "roberto"
}
```

The JWT:

- is created only after successful credential validation;
- expires after 24 hours;
- is stored in an `access_token` HttpOnly cookie;
- is read from that cookie by protected endpoints;
- is not stored in the database.

`POST /auth/logout` requires authentication and clears the cookie. Registration is out of scope.

The current cookie configuration is intended for local HTTP development: `SameSite=Lax` and `Secure=false`.

## Sample credentials

The Prisma seed creates exactly these local users:

```txt
username: roberto
password: 12345

username: lautaro
password: 12345

username: nico
password: 12345

username: aida
password: 12345
```

The seed hashes these passwords with `bcrypt` before storing them.

## API endpoints

### Public endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/login` | Validate credentials, set the authentication cookie, and return the user |
| `GET` | `/restaurants` | List restaurants with calculated rating information |
| `GET` | `/restaurants/:id` | Get one restaurant by integer ID |
| `GET` | `/restaurants/:restaurantId/availability?date=YYYY-MM-DD&partySize=4` | Calculate reservation slots for a restaurant, date, and party size |
| `GET` | `/restaurants/:restaurantId/comments` | List comments for a restaurant |

### Protected endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/logout` | Clear the authentication cookie |
| `POST` | `/restaurants` | Create a restaurant |
| `PATCH` | `/restaurants/:id` | Update accepted fields on a restaurant |
| `DELETE` | `/restaurants/:id` | Delete a restaurant that has no related records |
| `POST` | `/reservations` | Create a confirmed reservation after recalculating slot availability |
| `GET` | `/me/reservations` | List the authenticated user's reservations, newest first |
| `GET` | `/reservations/:reservationId` | Get an owned reservation |
| `PATCH` | `/reservations/:reservationId/cancel` | Cancel an owned confirmed reservation |
| `GET` | `/me/favourites` | List the authenticated user's favourite restaurants |
| `POST` | `/me/favourites/:restaurantId` | Add a restaurant to the authenticated user's favourites |
| `DELETE` | `/me/favourites/:restaurantId` | Remove an owned favourite |
| `POST` | `/restaurants/:restaurantId/comments` | Create a comment as the authenticated user |
| `PATCH` | `/comments/:commentId` | Update an owned comment |
| `DELETE` | `/comments/:commentId` | Delete an owned comment |

## Request examples

### Login

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "username": "aida",
  "password": "12345"
}
```

### Create a restaurant

This request requires the login cookie:

```http
POST /restaurants
Content-Type: application/json
```

```json
{
  "name": "Example Restaurant",
  "neighborhood": "Manhattan",
  "address": "123 Example St",
  "lat": 40.713829,
  "lng": -73.989667,
  "image": "https://example.com/image.jpg",
  "photograph": "example.jpg",
  "cuisineType": "Asian",
  "description": "Short restaurant description.",
  "capacity": 72,
  "operatingHours": {
    "Monday": "5:30 pm - 11:00 pm"
  },
  "reservationSettings": {
    "slotIntervalMinutes": 30,
    "defaultSlotCapacity": 8,
    "serviceWindows": [
      {
        "name": "lunch",
        "start": "13:00",
        "end": "15:00"
      },
      {
        "name": "dinner",
        "start": "20:00",
        "end": "23:00"
      }
    ],
    "bookedSlots": []
  }
}
```

All create fields are required. `capacity` must be an integer of at least `1`; `operatingHours` and `reservationSettings` must be JSON objects.

### Update a restaurant

The update payload accepts any subset of the create fields:

```http
PATCH /restaurants/1
Content-Type: application/json
```

```json
{
  "name": "Updated Restaurant Name",
  "capacity": 80
}
```

### Check availability

This endpoint is public:

```http
GET /restaurants/1/availability?date=2026-07-10&partySize=4
```

Example response:

```json
{
  "restaurantId": 1,
  "date": "2026-07-10",
  "slots": [
    {
      "time": "13:00",
      "capacity": 8,
      "reservedSeats": 8,
      "availableSeats": 0,
      "available": false
    },
    {
      "time": "13:30",
      "capacity": 8,
      "reservedSeats": 3,
      "availableSeats": 5,
      "available": true
    }
  ]
}
```

The `date` must be a real `YYYY-MM-DD` date that is today or later. `partySize` must be an integer from `1` to `99`. A missing or invalid query value returns `400 Bad Request`; an unknown restaurant returns `404 Not Found`.

### Create a reservation

This request requires the login cookie:

```http
POST /reservations
Content-Type: application/json
```

```json
{
  "restaurantId": 1,
  "date": "2026-07-10",
  "time": "13:30",
  "partySize": 4
}
```

The authenticated user is taken from the JWT. Unknown fields, including `userId` and `status`, are rejected.

Example response:

```json
{
  "id": 1,
  "restaurantId": 1,
  "userId": 1,
  "date": "2026-07-10",
  "time": "13:30",
  "partySize": 4,
  "status": "confirmed",
  "createdAt": "2026-06-21T10:00:00.000Z",
  "updatedAt": "2026-06-21T10:00:00.000Z",
  "cancelledAt": null
}
```

### Read reservations

```http
GET /me/reservations
GET /reservations/1
```

Users can list and read only their own reservations. The list is ordered by creation time descending.

### Cancel a reservation

```http
PATCH /reservations/1/cancel
```

Cancellation returns the complete updated reservation with `status: "cancelled"` and `cancelledAt` set. Cancelling an already cancelled reservation returns `409 Conflict`.

### Manage favourites

All favourite endpoints require the login cookie. Adding and removing a favourite do not require a request body.

```http
POST /me/favourites/1
GET /me/favourites
DELETE /me/favourites/1
```

Creating a favourite returns `201 Created`:

```json
{
  "id": 1,
  "restaurantId": 1,
  "createdAt": "2026-06-21T10:00:00.000Z",
  "restaurant": {
    "id": 1,
    "name": "Mission Chinese Food",
    "averageRating": 3.6666666666666665,
    "commentsCount": 3
  }
}
```

The nested `restaurant` contains the complete restaurant response, not only the abbreviated fields shown above.

Listing favourites returns:

```json
{
  "results": []
}
```

Results contain only the authenticated user's favourites and are ordered by `createdAt` descending, then by favourite `id` descending. Duplicate favourites return `409 Conflict`. Removing a favourite returns `204 No Content` and does not delete the restaurant.

### Read comments

Comment listing is public:

```http
GET /restaurants/1/comments
```

```json
{
  "results": [
    {
      "id": 1,
      "restaurantId": 1,
      "userId": 1,
      "name": "roberto",
      "date": "2026-06-21",
      "rating": 4,
      "body": "Great food and good service.",
      "createdAt": "2026-06-21T10:00:00.000Z",
      "updatedAt": "2026-06-21T10:00:00.000Z"
    }
  ]
}
```

An existing restaurant without comments returns an empty `results` array.

### Create a comment

This request requires the login cookie:

```http
POST /restaurants/1/comments
Content-Type: application/json
```

```json
{
  "rating": 4,
  "body": "Great food and service."
}
```

`rating` must be an integer from `1` to `5`. `body` must contain non-whitespace text and cannot exceed 1000 characters. The API generates `userId`, `name`, and the current UTC `date` from the authenticated user and server time.

### Update or delete a comment

Only the comment author can perform these operations:

```http
PATCH /comments/1
Content-Type: application/json
```

```json
{
  "rating": 5,
  "body": "Updated review."
}
```

An update may contain `rating`, `body`, or both, but it cannot be empty. Deleting a comment uses:

```http
DELETE /comments/1
```

Successful deletion returns `204 No Content`. An authenticated non-author receives `403 Forbidden`.

## Postman usage

1. Run the migration and seed steps, then start the API.
2. Send `POST /auth/login` with one of the sample users.
3. Allow Postman to retain the `access_token` HttpOnly cookie.
4. Call protected endpoints from the same Postman session.
5. Send `POST /auth/logout` to clear the cookie.

The token does not need to be copied into an `Authorization` header.

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

The currently implemented business rules are:

- Restaurant ratings are calculated from persisted comments and are not stored on the restaurant.
- Restaurant responses include `averageRating` and `commentsCount`.
- `averageRating` is `null` when a restaurant has no comments.
- Restaurant reads are public.
- Restaurant mutations require a valid authenticated user; there is no admin role.
- Create requests require all restaurant DTO fields.
- Update requests accept a partial set of the same fields.
- Unknown request fields are rejected.
- Restaurant capacity must be an integer greater than or equal to `1`.
- A missing restaurant returns `404 Not Found`.
- A restaurant with comments, favourites, or reservations cannot be deleted and returns `409 Conflict`.
- Invalid login credentials always return the same public message.
- The seed keeps service windows and booked slots inside `Restaurant.reservationSettings`.
- Availability is generated on demand and is not stored in a separate database model.
- Availability slots come from each restaurant's service windows and slot interval.
- Service window start times are included and end times are excluded.
- Slot capacity comes from `reservationSettings.defaultSlotCapacity`.
- Matching seeded booked slots and confirmed reservations reduce available seats.
- Cancelled reservations do not reduce available seats.
- Available seats never fall below zero.
- Every generated slot is returned, including unavailable slots.
- A slot is marked available only when it can fit the requested party size.
- Checking availability does not create or update reservations or mutate seeded booked slots.
- Reservations belong to the authenticated user and cannot be created for another user.
- Reservation dates and times are validated in UTC and cannot be in the past.
- Reservation times must match a generated restaurant slot.
- Reservation creation recalculates availability inside a serializable database transaction.
- Concurrent requests cannot consume more capacity than the slot provides.
- Transaction conflicts are retried; unavailable capacity returns `409 Conflict`.
- Availability calculation is shared through a database-free `AvailabilityCalculator`.
- Creating a reservation consumes capacity; cancelling it releases capacity.
- Users can list, read, and cancel only their own reservations.
- A cancelled reservation cannot be cancelled again.
- Favourites belong to the authenticated user.
- Favourite lists contain enriched restaurant responses and only the current user's records.
- Duplicate favourites return `409 Conflict`.
- Removing a missing or unowned favourite returns `404 Not Found`.
- Removing a favourite deletes only the relation and leaves the restaurant unchanged.
- Restaurant and favourite path IDs must be positive integers.
- Comments can be listed publicly for an existing restaurant.
- Comment creation uses the authenticated user's ID and username as the author.
- Comment dates are generated server-side from the current UTC date.
- Comment ratings must be integers from `1` to `5`.
- Comment bodies must contain non-whitespace text and cannot exceed 1000 characters.
- Only a comment author can update or delete that comment.
- Updating or deleting another user's comment returns `403 Forbidden`.
- Comment updates require at least one editable field.
- Restaurant rating remains calculated from comments instead of being stored as a mutable field.

## Technical decisions and trade-offs

- The backend is maintained as a separate repository and implemented before frontend integration.
- Local development uses PostgreSQL.
- Database changes use Prisma migrations, and initial data uses a reproducible Prisma seed.
- Authentication uses a JWT in an HttpOnly cookie instead of database token storage.
- Registration is intentionally out of scope; local testing uses four predefined users.
- The application uses a direct controller/service/repository structure without additional architectural layers.
- Reservation creation uses a repository-managed serializable transaction while availability rules remain in the service layer.
- Availability and Reservations share slot calculation without coupling their services.
- Any authenticated user can mutate restaurants for the MVP; no admin role exists.
- Swagger and Docker have not been added and remain optional final improvements.

## AI usage notes

AI/Codex was used as an implementation assistant for specifications, prompts, planning, documentation, and implementation support. The developer reviewed the resulting code, API contracts, errors, and business rules.

Generated output was checked against `constitution.back.md`, the active specifications, and the repository source. Invented endpoints, unrelated refactors, overengineering, registration, payments, admin roles, and premature Docker or Swagger work were rejected or avoided.

## Current limitations

- The e2e tests depend on a configured and seeded local database.
- Frontend integration is not included in this repository.
- The local authentication cookie is not configured for HTTPS production use.
- Swagger documentation is not available.
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
9. Call `GET /restaurants` and `GET /restaurants/1`.
10. Call `GET /restaurants/1/availability?date=2026-07-10&partySize=4`.
11. Verify that booked slots reduce `availableSeats` and that the response includes unavailable slots.
12. Create a reservation with authenticated `POST /reservations`.
13. List it with `GET /me/reservations`.
14. Read it with `GET /reservations/:reservationId`.
15. Cancel it with `PATCH /reservations/:reservationId/cancel`.
16. Verify that the cancelled reservation no longer reduces availability.
17. Add a favourite with `POST /me/favourites/:restaurantId`.
18. List it with `GET /me/favourites`.
19. Remove it with `DELETE /me/favourites/:restaurantId`.
20. List restaurant comments with `GET /restaurants/:restaurantId/comments`.
21. Create a comment with authenticated `POST /restaurants/:restaurantId/comments`.
22. Update it with `PATCH /comments/:commentId`.
23. Delete it with `DELETE /comments/:commentId`.
24. Create a restaurant with authenticated `POST /restaurants`.
25. Update it with authenticated `PATCH /restaurants/:id`.
26. Delete it with authenticated `DELETE /restaurants/:id`.
27. Call `POST /auth/logout`.
28. Run `npm run test`, `npm run test:e2e`, and `npm run build`.
