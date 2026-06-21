# Restaurant Reservation API

## Project overview

This repository contains the backend REST API for a restaurant reservation application. It is built with NestJS and TypeScript, uses PostgreSQL through Prisma ORM, and authenticates users with JWTs stored in HttpOnly cookies.

The current implementation includes authentication, restaurant CRUD, on-demand availability, reservations, shared API error handling, Prisma models, and reproducible local seed data. Favourites and comment endpoints remain to be implemented.

## Current feature status

| Feature | Status | Current state |
| --- | --- | --- |
| Authentication | Implemented | Login, JWT cookie authentication, protected routes, and logout |
| Restaurants CRUD | Implemented | Public reads and authenticated create, update, and delete |
| Availability | Implemented | Public, on-demand slot calculation using settings, booked slots, and confirmed reservations |
| Reservations | Implemented | Authenticated creation, owned list and detail, cancellation, and transactional capacity enforcement |
| Favourites | Not implemented yet | Prisma model and uniqueness constraint exist, but no module or endpoints are implemented |
| Comments | Partially implemented | Seeded comments and rating aggregation exist; comment endpoints do not |
| Error handling | Implemented | Global exception filter and structured validation details |
| Database seed | Implemented | Reproducible restaurant, comment, and user seed |
| Tests | Partially implemented | Authentication, restaurants, availability, and reservations have service and/or e2e coverage |

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
|   |-- common/
|   |   |-- errors/
|   |   `-- filters/
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

### Endpoints not implemented yet

There are currently no favourite or comment endpoints. Their routes are defined as future requirements in the project constitution but are not registered by the application.

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

Duplicate favourite handling and comment ownership rules are not implemented yet.

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

- Favourite endpoints and ownership logic are not implemented.
- Comment endpoints and ownership logic are not implemented.
- Test coverage currently focuses on authentication, restaurants, availability, and reservations.
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
17. Create a restaurant with authenticated `POST /restaurants`.
18. Update it with authenticated `PATCH /restaurants/:id`.
19. Delete it with authenticated `DELETE /restaurants/:id`.
20. Call `POST /auth/logout`.
21. Run `npm run test`, `npm run test:e2e`, and `npm run build`.
