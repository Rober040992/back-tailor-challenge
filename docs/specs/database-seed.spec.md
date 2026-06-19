# Database Seed

## Feature name

Database seed.

## Purpose

Populate the local PostgreSQL database with reproducible initial data for restaurants, restaurant comments, and four predefined users used to test authenticated flows.

The seed must import the supplied restaurant dataset without changing the source JSON and must preserve the data structures required for later availability calculations.

## Scope

- Load initial restaurant data from `prisma/seed-data/restaurants.json`.
- Create one `Restaurant` record for every restaurant in the JSON dataset.
- Create `Comment` records from each restaurant's `comments` array.
- Create exactly four predefined users for authentication testing.
- Hash every seed user password before storing it in `User.passwordHash`.
- Clear the existing data covered by this seed safely before inserting fresh data.
- Make repeated seed executions produce the same logical dataset without duplicates.
- Configure Prisma to execute a TypeScript seed file.
- Add the required npm `seed` script.
- Install `tsx` as a development dependency only if it is not already installed.

## Out of scope

- Changes to `prisma/schema.prisma`.
- New Prisma models, fields, enums, indexes, or constraints.
- Prisma migrations.
- Controllers, services, repositories, DTOs, or endpoints.
- Authentication or JWT implementation.
- User registration.
- Roles or authorization rules.
- Creating `Reservation` records from initial booked slots.
- Creating favourites or user-created reservations.
- Creating an `Availability` model.
- Creating models or tables for reservation settings, service windows, or booked slots.
- Modifying or rewriting `prisma/seed-data/restaurants.json`.
- Production data migration or production seeding.

## Endpoints or screens affected

None.

This feature only prepares local database data. No API contract is introduced or changed.

## Input contract

### Restaurant source

The seed must read `prisma/seed-data/restaurants.json` as its input dataset.

The JSON contains restaurant objects with these source fields:

- `id`
- `name`
- `neighborhood`
- `photograph`
- `address`
- `latlng`
- `image`
- `cuisine_type`
- `description`
- `capacity`
- `reservationSettings`
- `operating_hours`
- `comments`

Each restaurant entry must provide values that can be mapped to the existing required `Restaurant` fields:

| JSON source           | Prisma destination               |
| --------------------- | -------------------------------- |
| `name`                | `Restaurant.name`                |
| `neighborhood`        | `Restaurant.neighborhood`        |
| `address`             | `Restaurant.address`             |
| `latlng.lat`          | `Restaurant.lat`                 |
| `latlng.lng`          | `Restaurant.lng`                 |
| `image`               | `Restaurant.image`               |
| `photograph`          | `Restaurant.photograph`          |
| `cuisine_type`        | `Restaurant.cuisineType`         |
| `description`         | `Restaurant.description`         |
| `capacity`            | `Restaurant.capacity`            |
| `operating_hours`     | `Restaurant.operatingHours`      |
| `reservationSettings` | `Restaurant.reservationSettings` |

The complete `operating_hours` value must be stored as JSON in `Restaurant.operatingHours`.

The complete `reservationSettings` value must be stored as JSON in `Restaurant.reservationSettings`. Its nested `serviceWindows` and `bookedSlots` data must remain inside that JSON value.

### Comment source

For every restaurant entry, the seed must read its `comments` array and create related `Comment` records.

Each comment entry must provide values for:

| JSON source                                         | Prisma destination     |
| --------------------------------------------------- | ---------------------- |
| `name`                                              | `Comment.name`         |
| `date`                                              | `Comment.date`         |
| `rating`                                            | `Comment.rating`       |
| `body`                                              | `Comment.body`         |
| Parent restaurant created by the seed               | `Comment.restaurantId` |
| Seed user `roberto` created in the current seed run | `Comment.userId`       |

Every imported comment must be assigned to the seed user `roberto`.

The seed must:

- Ignore source `comment.userId` values completely.
- Not match comment ownership by `comment.name`.
- Preserve the original `comment.name` value.
- Not create users from comment names.
- Use the generated database ID of `roberto`, not a custom fixed user ID.

### Seed users

The seed must define exactly these four predefined users:

| Username  | Seed input password |
| --------- | ------------------- |
| `roberto` | `12345`             |
| `lautaro` | `12345`             |
| `nico`    | `12345`             |
| `aida`    | `12345`             |

Each password must be hashed with `bcrypt` before the user is inserted. Only the resulting value may be stored in `User.passwordHash`.

Plaintext passwords must never be stored in the database.
Plaintext passwords may exist only as in-memory seed input values.
The same `bcrypt` hashing and comparison approach must be reusable by the future authentication feature.

## Output contract

After a successful seed:

- The database contains exactly four predefined seed users.
- Every seed user has a password hash rather than a plaintext password.
- The database contains one `Restaurant` record for every valid restaurant entry in `prisma/seed-data/restaurants.json`.
- Every imported comment exists as a `Comment` related to its parent restaurant and the seed user `roberto`.
- `Restaurant.operatingHours` contains the source `operating_hours` JSON.
- `Restaurant.reservationSettings` contains the source `reservationSettings` JSON.
- Initial `bookedSlots` remain nested inside `Restaurant.reservationSettings`.
- No `Reservation` record is created from any initial booked slot.
- Running the seed repeatedly produces the same logical seed dataset without duplicate users, restaurants, or comments.
- The source `prisma/seed-data/restaurants.json` remains unchanged.

The seed command must exit successfully only after the complete seed operation succeeds.

## Business rules

- Initial restaurant data must come from `prisma/seed-data/restaurants.json`.
- The source JSON must be treated as read-only.
- Each restaurant's comments must be persisted in the existing `Comment` model.
- Comments must remain related to their parent restaurant.
- Every imported comment must belong to the seed user `roberto`.
- Source comment `userId` values and names must not determine ownership.
- Original comment names must be preserved.
- Exactly four predefined users must be created for authentication testing.
- Seed user passwords must be hashed before insertion.
- Password hashing must use `bcrypt`.
- Seed user credentials must be stable so authenticated test flows are reproducible.
- `operating_hours` must be stored in `Restaurant.operatingHours` without being converted into a separate model.
- `reservationSettings`, including `serviceWindows` and `bookedSlots`, must be stored in `Restaurant.reservationSettings`.
- Initial booked slots describe pre-existing capacity usage and must not create `Reservation` records.
- User-created reservations remain separate from the immutable source dataset.
- The seed must not create favourites.
- The seed must not create availability records.
- The seed must not create additional users, roles, or domain data.
- The seed is for local development only.
- The seed must remove all existing records from the seeded database before recreating the dataset.
- Cleanup must delete records in this exact dependency-safe order:
  1. `Favourite`
  2. `Comment`
  3. `Reservation`
  4. `Restaurant`
  5. `User`
- The seed must not preserve user-created local records.
- The seed must not add seed marker fields.
- The seed must not change the Prisma schema.
- A failed seed must not leave a partially refreshed dataset.

## Validation rules

- `prisma/seed-data/restaurants.json` must exist before the seed runs.
- The top-level restaurant collection must be readable and parseable as JSON.
- Every restaurant entry must contain all values required by the existing non-nullable `Restaurant` fields.
- `latlng.lat` and `latlng.lng` must be valid numbers.
- `capacity` must be a valid integer.
- `operating_hours` must be valid JSON data.
- `reservationSettings` must be valid JSON data.
- Each restaurant `comments` value must be an array.
- Every imported comment must contain values for the existing non-nullable `Comment` fields.
- Every imported comment must be associated with `roberto` and its parent restaurant.
- Source comment `userId` values must be ignored.
- Source comment names must not be used to determine ownership.
- Original source comment names must be stored unchanged.
- Source comment names must never create additional users.
- Exactly four seed user definitions must exist.
- The seed usernames must be exactly `roberto`, `lautaro`, `nico`, and `aida`.
- Every seed input password must be exactly `12345`.
- Seed passwords must be hashed before Prisma receives the user creation data.
- Seed password hashing must use `bcrypt`.
- The seed must not insert plaintext passwords into `passwordHash`.
- The seed must not create `Reservation` records for `bookedSlots`.
- The seed must not modify `prisma/seed-data/restaurants.json`.
- The cleanup and insertion process must be reproducible and safe to run more than once.

## Error cases

The seed must fail with a non-zero exit code when:

- `prisma/seed-data/restaurants.json` cannot be found or read.
- The JSON is malformed.
- A required restaurant field is missing or has an incompatible type.
- A required comment field is missing or has an incompatible type.
- The four seed users are not fully defined.
- A seed password cannot be hashed with `bcrypt`.
- The database connection fails.
- Cleanup fails.
- A Prisma insert fails.
- The complete seed operation cannot be committed.

The seed must report enough context to identify the failed phase without logging plaintext passwords, password hashes, or database credentials.

This feature does not introduce HTTP errors or API error responses.

## Ownership or auth rules if relevant

- The four users exist only to support later authentication and ownership testing.
- Seed user passwords must use `bcrypt`, and the future authentication feature must use the corresponding `bcrypt` comparison approach.
- Imported comments require a valid `userId` because every `Comment` belongs to a user.
- Every imported comment must use the generated database ID of `roberto`.
- Source comment IDs and names must not be used to determine comment ownership.
- This feature does not implement login, JWT creation, cookies, guards, or ownership enforcement.
- Registration remains out of scope.

## Test cases

1. The seed command loads `prisma/seed-data/restaurants.json`.
2. One restaurant is created for each source restaurant.
3. `cuisine_type` is stored as `cuisineType`.
4. `latlng.lat` is stored as `lat`.
5. `latlng.lng` is stored as `lng`.
6. `operating_hours` is stored unchanged as `operatingHours` JSON.
7. `reservationSettings` is stored as JSON.
8. `reservationSettings.serviceWindows` remains nested in `reservationSettings`.
9. `reservationSettings.bookedSlots` remains nested in `reservationSettings`.
10. No `Reservation` records are created from booked slots.
11. Every source comment creates one related `Comment` record.
12. Every imported comment belongs to its parent restaurant.
13. Every imported comment belongs to `roberto`.
14. Source `comment.userId` values are ignored.
15. Comment names do not determine ownership.
16. Original comment names are preserved and never create additional users.
17. Exactly four predefined users are created: `roberto`, `lautaro`, `nico`, and `aida`.
18. Every seed user's input password is `12345`.
19. Seed usernames are unique.
20. Stored user passwords are `bcrypt` hashes and do not equal `12345`.
21. Running the seed twice does not duplicate users, restaurants, or comments.
22. A failed insertion does not leave a partially refreshed seed dataset.
23. Existing data is deleted in this order: favourites, comments, reservations, restaurants, users.
24. Existing user-created local records are not preserved.
25. The original `prisma/seed-data/restaurants.json` content is unchanged after seeding.
26. `npm run seed` invokes only `prisma db seed`.
27. Prisma invokes `tsx prisma/seed.ts` for the seed implementation.

## Implementation notes

- The implementation must create the seed entry point at `prisma/seed.ts`.
- The implementation must use the existing Prisma Client and PostgreSQL datasource.
- The implementation must not change `prisma/schema.prisma` or create a migration.
- The implementation must add this exact package script:

```json
{
  "scripts": {
    "seed": "prisma db seed"
  }
}
```

- The implementation must configure Prisma with:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- The `seed` script must not include extra commands before or after `prisma db seed`.
- Install `tsx` as a development dependency only if it is not already installed.
- Use `bcrypt` as the approved password-hashing dependency.
- Add only the TypeScript support required by the selected `bcrypt` package when necessary.
- Cleanup and insertion should execute atomically when supported by the chosen Prisma operations.
- Cleanup must delete favourites, comments, reservations, restaurants, and users in that exact order.
- Cleanup applies to all records in the local development database; it must not attempt to distinguish seed records from user-created records.
- Do not reset, drop, or recreate the schema as part of the seed.
- Do not add seed marker fields.
- Do not modify `prisma/schema.prisma`.
- Do not mutate the parsed source objects when mapping them to Prisma input where mutation could alter the source dataset.
- Do not log credentials or password material.
- The command below must be documented later in the README, outside this implementation scope:

```bash
npm run seed
```

## Open questions, if any

None.
