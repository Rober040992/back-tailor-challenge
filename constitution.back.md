# Project Constitution

## Mandatory Rules

- This file is the main source of truth for the backend repository.
- All code, comments, commits, documentation and technical files must be written in English.
- The project must stay simple, pragmatic and maintainable.
- Do not add features that are not explicitly required or approved.
- Do not overengineer the architecture.
- Follow SOLID principles where they improve clarity.
- Every feature must have an approved spec before implementation.
- Never jump directly from an idea to code.
- Backend must be implemented before frontend integration.
- Codex must not modify unrelated files.
- Codex must not invent endpoints, fields, models or business rules.
- If a requirement is unclear, Codex must stop and ask before implementing.
- Swagger and Docker are optional final improvements, not part of the core MVP.

## Shared Workflow

### Source hierarchy

The backend repository must follow this hierarchy:

1. `constitution.back.md`
2. Feature specs
3. `AGENTS.md`
4. Codex task prompt
5. Implementation

If there is a conflict, the higher-level document wins.

### Feature workflow

Every backend feature must follow this flow:

1. Read the related constitution section.
2. Read the related feature spec.
3. Propose a short plan.
4. Wait for approval.
5. Implement only the approved scope.
6. Add or update relevant tests.
7. Review the result against the spec and constitution.

### Feature priority

Backend features must be implemented in this order:

1. Data models and Prisma schema
2. Authentication
3. Restaurants CRUD
4. Availability and reservations
5. Favourites and comments
6. Backend tests and documentation
7. Optional improvements

## Backend Constitution

### Stack

- Use NestJS.
- Use TypeScript.
- Use PostgreSQL locally.
- Use Prisma ORM.
- Use JWT authentication.
- Use `HttpOnly` cookies for authentication.
- Use Postman for manual API testing during development.

### Architecture

Use a layered backend architecture:

```txt
HTTP -> Controller -> Service -> Repository -> Database
```

Responsibilities:

- Controllers handle HTTP, route params, query params, body input and DTO validation.
- DTOs validate request input.
- Services contain business logic.
- Repositories contain all Prisma queries.
- PrismaService owns database access.
- Controllers must not contain business logic.
- Controllers must not call Prisma directly.
- Services must not call Prisma directly.
- Repositories must not contain business rules that belong in services.

Do not use ports, adapters, use cases or hexagonal architecture for this challenge unless explicitly approved.

### Suggested structure

```txt
src/
  auth/
    auth.controller.ts
    auth.service.ts
    jwt.strategy.ts
    dto/
      login.dto.ts

  restaurants/
    restaurants.controller.ts
    restaurants.service.ts
    restaurants.repository.ts
    dto/
      create-restaurant.dto.ts
      update-restaurant.dto.ts

  comments/
    comments.controller.ts
    comments.service.ts
    comments.repository.ts
    dto/
      create-comment.dto.ts
      update-comment.dto.ts

  favourites/
    favourites.controller.ts
    favourites.service.ts
    favourites.repository.ts

  availability/
    availability.controller.ts
    availability.service.ts

  reservations/
    reservations.controller.ts
    reservations.service.ts
    reservations.repository.ts
    dto/
      create-reservation.dto.ts

  prisma/
    prisma.service.ts

  common/
    filters/
    errors/
```

### Naming rules

- Use plural module names: `restaurants`, `reservations`, `comments`.
- Use explicit file names:
  - `restaurants.controller.ts`
  - `restaurants.service.ts`
  - `restaurants.repository.ts`
  - `create-restaurant.dto.ts`
  - `update-restaurant.dto.ts`
- Use clear and literal names.
- Boolean variables must be named with `is`, `has`, `can` or `should` when possible.
- Avoid vague names such as `data`, `item`, `thing` or `stuff` unless the context is obvious.

### Database rules

- The database schema must be defined through Prisma models.
- Do not create tables manually.
- Do not create extra Prisma models or tables for `reservationSettings`, `serviceWindows` or `bookedSlots`.
- They must remain inside `Restaurant.reservationSettings` as JSON.
- Database changes must be managed through Prisma migrations.
- Initial restaurant data must be imported through a Prisma seed.
- Seed data must be reproducible.
- User-created reservations must be stored in the `Reservation` model.
- Do not mutate the original seed data when users create reservations.

## Database Model Decisions

The backend database must use PostgreSQL with Prisma ORM.

Availability must not be represented as a Prisma model.
Availability is calculated dynamically from `Restaurant.reservationSettings` and confirmed/cancelled reservations.

The Prisma schema must use `Int @id @default(autoincrement())` for all primary IDs.

The Prisma schema must define the following core models:

```txt
User
Restaurant
Reservation
Comment
Favourite
```
### Database Field Type Decisions

The Prisma schema must follow these field type decisions.

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
User.username: String
User.passwordHash: String
User.createdAt: DateTime
User.updatedAt: DateTime
```

Restaurant fields:

```txt
Restaurant.name: String
Restaurant.neighborhood: String
Restaurant.address: String
Restaurant.lat: Float
Restaurant.lng: Float
Restaurant.image: String
Restaurant.photograph: String
Restaurant.cuisineType: String
Restaurant.description: String
Restaurant.capacity: Int
Restaurant.operatingHours: Json
Restaurant.reservationSettings: Json
Restaurant.createdAt: DateTime
Restaurant.updatedAt: DateTime
```

Reservation fields:

```txt
Reservation.date: String
Reservation.time: String
Reservation.partySize: Int
Reservation.status: ReservationStatus
Reservation.createdAt: DateTime
Reservation.updatedAt: DateTime
Reservation.cancelledAt: DateTime?
```

Comment fields:

```txt
Comment.name: String
Comment.date: String
Comment.rating: Int
Comment.body: String
Comment.createdAt: DateTime
Comment.updatedAt: DateTime
```

Favourite fields:

```txt
Favourite.userId: Int
Favourite.restaurantId: Int
Favourite.createdAt: DateTime
```

The Prisma schema must define this enum:

```prisma
enum ReservationStatus {
  confirmed
  cancelled
}
```

All core models must include `createdAt` and `updatedAt`, except `Favourite`, which only requires `createdAt`.



### Database Relationship Decisions

The Prisma schema must follow these relationships:

- `User` has many `Reservation`.
- `Restaurant` has many `Reservation`.
- `User` has many `Comment`.
- `Restaurant` has many `Comment`.
- `User` and `Restaurant` are connected through `Favourite`.

Important constraints:

- `Favourite` must have a unique constraint on `userId + restaurantId`.
- `Reservation` must not have a unique constraint on `restaurantId + date + time`.
- `Restaurant.reservationSettings` must be stored as JSON.
- Reservation settings, service windows and initial booked slots must be stored inside `Restaurant.reservationSettings` as JSON.
- Do not create separate Prisma models or tables for reservation settings, service windows or booked slots unless a future approved spec explicitly changes this.

### Authentication rules

- JWT must be generated only after successful login.
- JWT must be stored in an `HttpOnly` cookie.
- JWT expiration must be 24 hours.
- JWT tokens must not be stored in the database.
- Protected endpoints must read the authenticated user from the JWT.
- Logout must clear the authentication cookie.
- User registration is out of scope unless explicitly approved.
- The project will use 4 predefined seed users for testing authenticated flows.
- Sample credentials must be documented in the README.

### Authorization and ownership rules

Ownership means that an authenticated user can only operate on resources that belong to that user.

Rules:

- `GET /me/favourites` returns only the authenticated user’s favourites.
- `POST /me/favourites/:restaurantId` creates a favourite only for the authenticated user.
- `DELETE /me/favourites/:restaurantId` removes a favourite only from the authenticated user.
- `POST /restaurants/:restaurantId/comments` creates a comment using the authenticated user as author.
- `PATCH /comments/:commentId` is allowed only for the comment author.
- `DELETE /comments/:commentId` is allowed only for the comment author.
- `POST /reservations` creates a reservation only for the authenticated user.
- `GET /me/reservations` returns only the authenticated user’s reservations.
- `GET /reservations/:reservationId` is allowed only for the reservation owner.
- `PATCH /reservations/:reservationId/cancel` is allowed only for the reservation owner.

HTTP meaning:

- `401 Unauthorized` means the user is not authenticated.
- `403 Forbidden` means the user is authenticated but does not own the resource.
- `404 Not Found` means the resource does not exist.

### API endpoints

Use these backend endpoints unless a future spec explicitly changes them:

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

### Public and private routes

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

Restaurant create, update and delete endpoints only require a valid authenticated user.
No admin role is required for this MVP.

### Error format

All API errors must follow this format:

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

- `statusCode` must match the HTTP status code.
- `error` must be a stable machine-readable code.
- `message` must be readable for humans.
- `path` must contain the request path.
- `timestamp` must be an ISO string.
- `details` is optional and should be used for field validation errors.
- Do not return different error shapes between modules.

### Status codes

Use these status codes consistently:

- `200 OK` for successful reads and updates with response body.
- `201 Created` for successful resource creation.
- `204 No Content` for successful delete operations without response body.
- `400 Bad Request` for invalid input or invalid query params.
- `401 Unauthorized` for missing or invalid JWT.
- `403 Forbidden` for authenticated users without permission.
- `404 Not Found` for missing resources.
- `409 Conflict` for capacity conflicts, duplicate favourites or invalid state conflicts.
- `500 Internal Server Error` for unexpected errors.

## Business Rules

### Restaurants

- Restaurants must support CRUD operations.
- Restaurant list and detail responses must include enough data for frontend list and detail views.
- Restaurant responses must include name, description, address, image, capacity and cuisine type.
- Restaurant reservation settings must include service windows, slot interval and default slot capacity.
- Restaurant rating must not be stored manually as a mutable restaurant field.
- Restaurant rating must be calculated from comment ratings as `averageRating`.
- Restaurant responses must include `averageRating` and `commentsCount`.
- If a restaurant has no comments, `averageRating` must be `null`.

### Comments

- Comments belong to a restaurant.
- Comments belong to a user.
- Comments must support create, read, update and delete.
- Only the comment author can edit a comment.
- Only the comment author can delete a comment.

### Favourites

- Favourites belong to a user.
- A user can add a restaurant to favourites.
- A user can remove a restaurant from favourites.
- A user can retrieve only their own favourites.
- Duplicated favourites should return `409 Conflict`.

### Availability

- Availability must be generated on demand.
- Do not pre-create future dates.
- Availability must be scoped by restaurant, date and time.
- Availability must be generated from restaurant reservation settings.
- Service window start time is inclusive.
- Service window end time is exclusive.
- Default slots are generated from lunch and dinner service windows.
- Slot interval is defined by the restaurant settings.
- Each slot has a capacity.
- Existing bookedSlots inside Restaurant.reservationSettings reduce available seats. They are not a separate Prisma model or database table.
- Confirmed user reservations reduce available seats.
- Cancelled reservations release seats.
- Missing `date` must return `400 Bad Request`.
- Missing `partySize` must return `400 Bad Request`.
- A slot is selectable only when `availableSeats >= partySize`.

### Reservations

- Reservations belong to a restaurant.
- Reservations belong to a user.
- Reservation `date` must be stored as `YYYY-MM-DD`.
- Reservation `time` must be stored as `HH:MM`.
- Reservation status must be either `confirmed` or `cancelled`.
- A reservation cannot be created in the past.
- Party size must be greater than zero.
- Reservation time must match one of the generated restaurant slots.
- Party size cannot exceed available seats.
- Creating a reservation consumes capacity for the selected restaurant, date and time.
- Cancelling a reservation releases its seats.
- A cancelled reservation cannot be cancelled again.
- When a reservation is cancelled, `status` must be changed to `cancelled` and `cancelledAt` must be set.
- Availability must be recalculated server-side before accepting a reservation.
- The frontend availability response must never be trusted as the source of truth.
- Capacity conflicts must return `409 Conflict`.

## AI Workflow

- Codex is the implementation assistant inside VS Code.
- Codex must implement only from approved specs.
- Codex must not invent features.
- Codex must not modify unrelated files.
- Codex must not rewrite files without explicit approval.
- Codex must propose a short plan before implementation.
- Codex must list affected layers before implementation.
- Codex must review the result against the related spec.
- `AGENTS.md` must exist in the repository root.
- `.codex/` may be used only for optional prompts or notes.
- AI usage must be documented in the README.
- The README must explain what AI helped with, what was reviewed, and what was rejected or changed.

## Decisions

- The backend repository is separate from the frontend repository.
- The backend is implemented first.
- NestJS and TypeScript are the backend stack.
- PostgreSQL is the local database.
- Prisma ORM is used for schema, migrations and seed.
- The project uses JWT authentication.
- JWT is stored in an `HttpOnly` cookie.
- JWT expires after 24 hours.
- JWT tokens are not stored in the database.
- Registration is not part of the MVP.
- The app uses 4 predefined seed users.
- Restaurant rating is calculated from comments.
- New reservations are stored in the `Reservation` model.
- Initial booked slots remain inside `Restaurant.reservationSettings.bookedSlots`.
- Availability is generated on demand.
- Availability is recalculated server-side before reservation creation.
- API errors use one shared format.
- `409 Conflict` is used for overbooking, duplicated favourites and invalid state conflicts.
- Swagger is optional and can be added at the end.
- Docker is optional and can be added at the end.

## Out of Scope

- User registration.
- Payments.
- Admin roles.
- Multi-tenant support.
- WebSockets.
- Real-time updates.
- Complex RBAC.
- External authentication providers.
- Email notifications.
- SMS notifications.
- Search engine optimization.
- Production deployment unless there is time.
- Swagger before the core backend is complete.
- Docker before the core local flow works.