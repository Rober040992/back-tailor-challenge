# Project Constitution

## Mandatory rules

This file is the main source of truth for the backend repository.

All code, comments, commits, documentation and technical files must be written in English.

The project must stay simple, pragmatic and maintainable.

Every feature must have an approved spec before implementation.

Backend must be implemented before frontend integration.

Do not invent endpoints, fields, models or business rules.

Do not modify unrelated files.

If a requirement is unclear, stop and ask.

Swagger and Docker are optional final improvements.

## Source hierarchy

Follow this order:

1. `constitution.back.md`
2. Feature specs in `docs/specs`
3. `AGENTS.md`
4. Current Codex prompt
5. Implementation

If there is a conflict, the higher-level file wins.

## Feature priority

Backend features must be implemented in this order:

1. Data models and Prisma schema
2. Authentication
3. Restaurants CRUD
4. Availability and reservations
5. Favourites and comments
6. Backend tests and documentation
7. Optional improvements

## Stack

Use:

* NestJS
* TypeScript
* PostgreSQL locally
* Prisma ORM
* JWT authentication
* HttpOnly cookies
* npm
* Postman for manual API testing

## Architecture

Use layered architecture:

```txt
HTTP -> Controller -> Service -> Repository -> Database
```

Responsibilities:

* Controllers handle HTTP and DTO validation.
* Services contain business logic.
* Repositories contain Prisma queries.
* PrismaService owns database access.

Rules:

* Controllers must not contain business logic.
* Controllers must not call Prisma directly.
* Services must not call Prisma directly.
* Repositories must not contain service business logic.
* Do not use ports, adapters, use cases or hexagonal architecture unless approved.

## Suggested structure

```txt
src/
  auth/
  restaurants/
  comments/
  favourites/
  availability/
  reservations/
  prisma/
  common/
    filters/
    errors/
```

Use plural module names.

Use explicit file names.

Use clear and literal names.

Boolean variables should start with `is`, `has`, `can` or `should` when possible.

## Database rules

The database schema must be defined through Prisma models.

Do not create tables manually.

Use Prisma migrations for database changes.

Use Prisma seed for initial data.

Seed data must be reproducible.

Do not mutate original restaurant seed data when users create reservations.

Do not create extra Prisma models or tables for:

```txt
reservationSettings
serviceWindows
bookedSlots
availability
```

These must remain inside `Restaurant.reservationSettings` as JSON, except availability, which is calculated dynamically.

User-created reservations must be stored in the `Reservation` model.

## Prisma models

The schema must define:

```txt
User
Restaurant
Reservation
Comment
Favourite
```

All primary IDs must use:

```prisma
Int @id @default(autoincrement())
```

Primary IDs:

```txt
User.id: Int
Restaurant.id: Int
Reservation.id: Int
Comment.id: Int
Favourite.id: Int
```

Foreign keys:

```txt
Reservation.userId: Int
Reservation.restaurantId: Int
Comment.userId: Int
Comment.restaurantId: Int
Favourite.userId: Int
Favourite.restaurantId: Int
```

User fields:

```txt
username: String
passwordHash: String
createdAt: DateTime
updatedAt: DateTime
```

Restaurant fields:

```txt
name: String
neighborhood: String
address: String
lat: Float
lng: Float
image: String
photograph: String
cuisineType: String
description: String
capacity: Int
operatingHours: Json
reservationSettings: Json
createdAt: DateTime
updatedAt: DateTime
```

Reservation fields:

```txt
date: String
time: String
partySize: Int
status: ReservationStatus
createdAt: DateTime
updatedAt: DateTime
cancelledAt: DateTime?
```

Comment fields:

```txt
name: String
date: String
rating: Int
body: String
createdAt: DateTime
updatedAt: DateTime
```

Favourite fields:

```txt
userId: Int
restaurantId: Int
createdAt: DateTime
```

Reservation enum:

```prisma
enum ReservationStatus {
  confirmed
  cancelled
}
```

All core models must include `createdAt` and `updatedAt`, except `Favourite`, which only requires `createdAt`.

## Database relationships

Required relationships:

* `User` has many `Reservation`.
* `Restaurant` has many `Reservation`.
* `User` has many `Comment`.
* `Restaurant` has many `Comment`.
* `User` and `Restaurant` are connected through `Favourite`.

Constraints:

* `Favourite` must be unique on `userId + restaurantId`.
* `Reservation` must not be unique on `restaurantId + date + time`.

## Authentication

JWT must be generated only after successful login.

JWT must be stored in an HttpOnly cookie.

JWT expires after 24 hours.

JWT tokens must not be stored in the database.

Protected endpoints must read the authenticated user from the JWT.

Logout clears the authentication cookie.

Registration is out of scope.

The project uses 4 predefined seed users.

Sample credentials must be documented in the README.

## Authorization

Ownership means that an authenticated user can only operate on resources that belong to that user.

Rules:

* Users manage only their own favourites.
* Users list only their own reservations.
* Users read only their own reservation details.
* Users cancel only their own reservations.
* Comments are created using the authenticated user as author.
* Only comment authors can edit comments.
* Only comment authors can delete comments.

HTTP meaning:

* `401 Unauthorized`: user is not authenticated.
* `403 Forbidden`: user is authenticated but does not own the resource.
* `404 Not Found`: resource does not exist.

## API endpoints

Use these endpoints unless a future spec changes them.

```txt
auth:
POST   /auth/login
POST   /auth/logout

restaurants:
GET    /restaurants
GET    /restaurants/:id
POST   /restaurants
PATCH  /restaurants/:id
DELETE /restaurants/:id

favourites:
GET    /me/favourites
POST   /me/favourites/:restaurantId
DELETE /me/favourites/:restaurantId

comments:
GET    /restaurants/:restaurantId/comments
POST   /restaurants/:restaurantId/comments
PATCH  /comments/:commentId
DELETE /comments/:commentId

availability:
GET    /restaurants/:restaurantId/availability?date=YYYY-MM-DD&partySize=4

reservations:
POST   /reservations
GET    /me/reservations
GET    /reservations/:reservationId
PATCH  /reservations/:reservationId/cancel
```

Public routes:

```txt
POST /auth/login
GET  /restaurants
GET  /restaurants/:id
GET  /restaurants/:restaurantId/comments
GET  /restaurants/:restaurantId/availability?date=YYYY-MM-DD&partySize=4
```

Private routes:

```txt
POST   /auth/logout
POST   /restaurants
PATCH  /restaurants/:id
DELETE /restaurants/:id
GET    /me/favourites
POST   /me/favourites/:restaurantId
DELETE /me/favourites/:restaurantId
POST   /restaurants/:restaurantId/comments
PATCH  /comments/:commentId
DELETE /comments/:commentId
POST   /reservations
GET    /me/reservations
GET    /reservations/:reservationId
PATCH  /reservations/:reservationId/cancel
```

Restaurant create, update and delete only require a valid authenticated user.

No admin role is required for this MVP.

## Error format

All API errors must follow this shape:

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Party size must be greater than zero.",
  "path": "/reservations",
  "timestamp": "2026-06-18T18:30:00.000Z",
  "details": [
    {
      "field": "partySize",
      "message": "partySize must be greater than zero"
    }
  ]
}
```

Rules:

* `statusCode` must match the HTTP status.
* `error` must be a stable machine-readable code.
* `message` must be readable.
* `path` must contain the request path.
* `timestamp` must be an ISO string.
* `details` is optional.
* Do not return different error shapes between modules.

Status codes:

```txt
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

Use `409 Conflict` for overbooking, duplicate favourites and invalid state conflicts.

## Business rules

### Restaurants

Restaurants must support CRUD.

Restaurant responses must include enough data for list and detail views.

Restaurant responses must include:

```txt
name
description
address
image
capacity
cuisineType
reservationSettings
averageRating
commentsCount
```

Restaurant rating must be calculated from comments.

Do not store restaurant rating as a mutable restaurant field.

If a restaurant has no comments, `averageRating` must be `null`.

### Comments

Comments belong to a restaurant and a user.

Comments support create, read, update and delete.

Only the comment author can edit or delete a comment.

### Favourites

Favourites belong to a user.

Users can add, remove and list only their own favourites.

Duplicated favourites must return `409 Conflict`.

### Availability

Availability is generated on demand.

Do not pre-create future dates.

Availability is scoped by restaurant, date and time.

Availability is generated from restaurant reservation settings.

Service window start time is inclusive.

Service window end time is exclusive.

Slot interval comes from restaurant settings.

Existing `bookedSlots` reduce available seats.

Confirmed reservations reduce available seats.

Cancelled reservations release seats.

Missing `date` returns `400 Bad Request`.

Missing `partySize` returns `400 Bad Request`.

A slot is selectable only when `availableSeats >= partySize`.

### Reservations

Reservations belong to a restaurant and a user.

Reservation `date` is stored as `YYYY-MM-DD`.

Reservation `time` is stored as `HH:MM`.

Reservation status is `confirmed` or `cancelled`.

A reservation cannot be created in the past.

Party size must be greater than zero.

Reservation time must match a generated slot.

Party size cannot exceed available seats.

Creating a reservation consumes capacity.

Cancelling a reservation releases capacity.

A cancelled reservation cannot be cancelled again.

Cancelling a reservation sets:

```txt
status = cancelled
cancelledAt = current DateTime
```

Availability must be recalculated server-side before accepting a reservation.

The frontend availability response is never trusted.

Capacity conflicts return `409 Conflict`.

## Out of scope

* User registration
* Payments
* Admin roles
* Multi-tenant support
* WebSockets
* Real-time updates
* Complex RBAC
* External authentication providers
* Email notifications
* SMS notifications
* SEO
* Production deployment unless there is time
* Swagger before the core backend is complete
* Docker before the core local flow works
