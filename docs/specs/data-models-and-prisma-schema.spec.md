# Data Models and Prisma Schema

## Feature name

Data models and Prisma schema.

## Purpose

Define the PostgreSQL data model for the restaurant reservation backend using Prisma ORM.

This schema is the database foundation for authentication, restaurants, reservations, comments, favourites, and dynamically calculated availability.

## Scope

- Configure Prisma to use PostgreSQL.
- Define the following Prisma models:
  - `User`
  - `Restaurant`
  - `Reservation`
  - `Comment`
  - `Favourite`
- Define the `ReservationStatus` enum.
- Define the required scalar fields and field types.
- Define the relationships between the core models.
- Define the required favourite uniqueness constraint.
- Store restaurant operating hours and reservation configuration as JSON.
- Support database changes through Prisma migrations.

## Out of scope

- NestJS controllers, services, repositories, DTOs, or modules.
- REST endpoints and HTTP response handling.
- Authentication and JWT implementation.
- Authorization and ownership checks.
- Availability calculation.
- Reservation creation or cancellation logic.
- Restaurant, comment, or favourite business logic.
- Prisma seed data.
- Registration.
- An `Availability` Prisma model.
- Separate models or tables for reservation settings, service windows, or booked slots.
- Swagger, Docker, and deployment configuration.

## Endpoints or screens affected

None.

This feature defines only the database schema. Future backend features will use these models through repositories.

## Input contract

There is no HTTP input contract.

The Prisma schema must define the following database structures.

### User

| Field | Prisma type | Required |
| --- | --- | --- |
| `id` | `Int` | Yes |
| `username` | `String` | Yes |
| `passwordHash` | `String` | Yes |
| `createdAt` | `DateTime` | Yes |
| `updatedAt` | `DateTime` | Yes |

`id` must use:

```prisma
Int @id @default(autoincrement())
```

### Restaurant

| Field | Prisma type | Required |
| --- | --- | --- |
| `id` | `Int` | Yes |
| `name` | `String` | Yes |
| `neighborhood` | `String` | Yes |
| `address` | `String` | Yes |
| `lat` | `Float` | Yes |
| `lng` | `Float` | Yes |
| `image` | `String` | Yes |
| `photograph` | `String` | Yes |
| `cuisineType` | `String` | Yes |
| `description` | `String` | Yes |
| `capacity` | `Int` | Yes |
| `operatingHours` | `Json` | Yes |
| `reservationSettings` | `Json` | Yes |
| `createdAt` | `DateTime` | Yes |
| `updatedAt` | `DateTime` | Yes |

`id` must use:

```prisma
Int @id @default(autoincrement())
```

### Reservation

| Field | Prisma type | Required |
| --- | --- | --- |
| `id` | `Int` | Yes |
| `userId` | `Int` | Yes |
| `restaurantId` | `Int` | Yes |
| `date` | `String` | Yes |
| `time` | `String` | Yes |
| `partySize` | `Int` | Yes |
| `status` | `ReservationStatus` | Yes |
| `createdAt` | `DateTime` | Yes |
| `updatedAt` | `DateTime` | Yes |
| `cancelledAt` | `DateTime?` | No |

`id` must use:

```prisma
Int @id @default(autoincrement())
```

### Comment

| Field | Prisma type | Required |
| --- | --- | --- |
| `id` | `Int` | Yes |
| `userId` | `Int` | Yes |
| `restaurantId` | `Int` | Yes |
| `name` | `String` | Yes |
| `date` | `String` | Yes |
| `rating` | `Int` | Yes |
| `body` | `String` | Yes |
| `createdAt` | `DateTime` | Yes |
| `updatedAt` | `DateTime` | Yes |

`id` must use:

```prisma
Int @id @default(autoincrement())
```

### Favourite

| Field | Prisma type | Required |
| --- | --- | --- |
| `id` | `Int` | Yes |
| `userId` | `Int` | Yes |
| `restaurantId` | `Int` | Yes |
| `createdAt` | `DateTime` | Yes |

`id` must use:

```prisma
Int @id @default(autoincrement())
```

The model must enforce a composite unique constraint on:

```txt
userId + restaurantId
```

### ReservationStatus

The Prisma schema must define:

```prisma
enum ReservationStatus {
  confirmed
  cancelled
}
```

## Output contract

The implemented Prisma schema must:

- Be valid for the PostgreSQL provider.
- Generate a Prisma Client without schema validation errors.
- Expose the five required core models.
- Expose the `ReservationStatus` enum.
- Represent all required relationships.
- Enforce the required favourite composite uniqueness constraint.
- Keep availability as dynamically calculated application data rather than persisted availability records.

No HTTP response contract is introduced by this feature.

## Business rules

- `User` has many reservations.
- `Restaurant` has many reservations.
- Every reservation belongs to one user and one restaurant.
- `User` has many comments.
- `Restaurant` has many comments.
- Every comment belongs to one user and one restaurant.
- `User` and `Restaurant` are connected through `Favourite`.
- Every favourite belongs to one user and one restaurant.
- A user cannot have duplicate favourites for the same restaurant.
- A restaurant may have multiple reservations for the same date and time.
- `Reservation` must not have a unique constraint on `restaurantId`, `date`, and `time`.
- User-created reservations must be stored in the `Reservation` model.
- `Availability` must not be persisted as a Prisma model.
- Availability will be calculated dynamically from restaurant reservation settings and confirmed or cancelled reservations.
- `Restaurant.reservationSettings` must contain reservation settings, service windows, and initial booked slots as JSON.
- Initial booked slots must remain inside `Restaurant.reservationSettings.bookedSlots`.
- User-created reservations must not mutate the initial restaurant seed data.
- Restaurant rating must not be stored as a mutable field on `Restaurant`.

## Validation rules

- Every primary ID must be an auto-incrementing integer using `Int @id @default(autoincrement())`.
- `User.username` must use `@unique`.
- All foreign keys must use `Int`.
- All fields listed as required in the input contract must be non-nullable.
- `createdAt` must use `@default(now())`.
- `updatedAt` must use `@updatedAt`.
- `Reservation.cancelledAt` must be nullable.
- `Reservation.status` must use `ReservationStatus`.
- `Reservation.status` must use `@default(confirmed)`.
- `Restaurant.operatingHours` must use Prisma `Json`.
- `Restaurant.reservationSettings` must use Prisma `Json`.
- `Favourite` must have a composite unique constraint on `userId` and `restaurantId`.
- The schema must define valid relation fields for all required relationships.
- The schema must not define an `Availability` model.
- The schema must not define models for reservation settings, service windows, or booked slots.
- The schema must not define a uniqueness constraint that prevents multiple reservations for one restaurant, date, and time.

Application-level validation for date formats, time formats, ratings, capacity, party size, availability, and reservation state transitions belongs to later feature specs unless explicitly enforced by a future approved database decision.

## Error cases

This feature introduces no API errors.

The schema implementation must fail validation or generation when:

- A required model is missing.
- A required field has the wrong Prisma type.
- A required relationship is missing or invalid.
- A primary ID does not use the required integer auto-increment definition.
- The `ReservationStatus` enum is missing or has different values.
- The favourite composite unique constraint is missing.
- An `Availability` model is added.
- Reservation settings, service windows, or booked slots are represented as separate models.
- A prohibited reservation uniqueness constraint is added.

Database constraint failures and their mapping to the shared API error format will be specified in the relevant endpoint feature specs.

## Ownership or auth rules if relevant

The schema must support ownership through these foreign keys:

- `Reservation.userId`
- `Comment.userId`
- `Favourite.userId`

The schema does not implement authentication or authorization. Ownership enforcement belongs to later service and endpoint features.

## Test cases

1. Prisma schema validation succeeds.
2. Prisma Client generation succeeds.
3. The datasource provider is PostgreSQL.
4. The schema contains exactly the required core domain models and no `Availability` model.
5. Every core model uses an auto-incrementing `Int` primary ID.
6. All required scalar fields exist with the specified Prisma types and nullability.
7. `ReservationStatus` contains only `confirmed` and `cancelled`.
8. User-to-reservation and restaurant-to-reservation relationships are valid.
9. User-to-comment and restaurant-to-comment relationships are valid.
10. User-to-favourite and restaurant-to-favourite relationships are valid.
11. Duplicate `Favourite` records for the same `userId` and `restaurantId` are rejected by the database.
12. Multiple `Reservation` records can exist for the same restaurant, date, and time.
13. `Restaurant.operatingHours` accepts JSON values.
14. `Restaurant.reservationSettings` accepts JSON values containing service windows and booked slots.
15. `Reservation.cancelledAt` accepts `null`.
16. No separate models exist for reservation settings, service windows, or booked slots.

## Implementation notes

- Prisma schema is the source of truth for the database.
- Use the existing Prisma dependencies.
- Keep the schema simple and limited to the models and decisions in this specification.
- Use Prisma default referential actions unless a later approved spec requires explicit cascade or restrict behaviour.
- No additional indexes are required in this spec, except the `Favourite(userId, restaurantId)` unique constraint.
- Prisma queries must later be isolated in repositories through `PrismaService`.
- Database changes must be applied through Prisma migrations rather than manual table creation.
- Seed implementation is a separate scope.
- Do not add fields, models, enums, constraints, or indexes that are not approved by the constitution or a feature spec.
- Do not implement controllers, services, repositories, or business logic as part of the schema implementation.

## Open questions, if any


none.