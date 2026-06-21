## Spec: Reservations

**Goal:**

Allow authenticated users to create, read, list and cancel their own restaurant reservations while enforcing slot capacity from server-side availability.

**Endpoint(s):**

```txt
POST   /reservations
GET    /me/reservations
GET    /reservations/:reservationId
PATCH  /reservations/:reservationId/cancel
```

**Input:**

`POST /reservations`

```json
{
  "restaurantId": 1,
  "date": "2026-07-10",
  "time": "13:30",
  "partySize": 4
}
```

`GET /reservations/:reservationId`

```txt
reservationId: number
```

`PATCH /reservations/:reservationId/cancel`

```txt
reservationId: number
```

The authenticated user is taken from the JWT context.
`userId` must not be accepted from request body, query params or path params.
Unknown request body fields are not allowed.

**Output:**

Reservation response:

```json
{
  "id": 1,
  "restaurantId": 1,
  "userId": 1,
  "date": "2026-07-10",
  "time": "13:30",
  "partySize": 4,
  "status": "confirmed",
  "createdAt": "2026-06-20T10:00:00.000Z",
  "updatedAt": "2026-06-20T10:00:00.000Z",
  "cancelledAt": null
}
```

`GET /me/reservations` returns an array of reservation responses.
Reservations are ordered by `createdAt` descending, newest first.

`PATCH /reservations/:reservationId/cancel` returns the complete updated reservation response with `status: "cancelled"` and `cancelledAt` set to the current DateTime.

Success status codes:

* `POST /reservations`: `201 Created`
* `GET /me/reservations`: `200 OK`
* `GET /reservations/:reservationId`: `200 OK`
* `PATCH /reservations/:reservationId/cancel`: `200 OK`

**Business rules:**

* A reservation belongs to one restaurant and one user.
* A reservation can only be created for the authenticated user.
* A reservation cannot be created in the past using UTC as the application timezone.
* Reservation `date` must be stored as `YYYY-MM-DD`.
* Reservation `time` must be stored as `HH:MM`.
* Reservation status must be `confirmed` when created.
* Reservation time must match one generated slot for the restaurant.
* Reservation creation must run inside a database transaction.
* Availability must be recalculated inside that transaction before creating the reservation.
* Slot calculation must be shared through an `AvailabilityCalculator` with no database access.
* `ReservationsService` must use the calculator directly and must not depend on `AvailabilityService`.
* Concurrent requests must not allow slot capacity to be exceeded.
* If capacity is no longer available, return `409 Conflict`.
* Do not add availability tables, manual locks, queues or background workers.
* The frontend availability response must never be trusted as the source of truth.
* Party size cannot exceed available seats for the selected slot.
* Creating a reservation consumes capacity for the same restaurant, date and time.
* Cancelled reservations must not reduce available seats.
* Cancelling a reservation sets `status` to `cancelled` and `cancelledAt` to the current DateTime.
* A cancelled reservation cannot be cancelled again.
* Users can list only their own reservations.
* Users can read only their own reservation details.
* Users can cancel only their own reservations.

**Validation:**

* `restaurantId` is required and must be a positive integer.
* `date` is required and must be a valid `YYYY-MM-DD` date.
* `time` is required and must be a valid `HH:MM` time.
* `partySize` is required and must be a positive integer.
* `reservationId` must be a positive integer.
* Request bodies containing unknown fields, including `userId` or `status`, return `400 Bad Request`.
* Missing or invalid input returns `400 Bad Request`.
* Restaurant not found returns `404 Not Found`.
* Reservation not found returns `404 Not Found`.
* Reservation owned by another user returns `403 Forbidden`.
* Not authenticated returns `401 Unauthorized`.
* Overbooking returns `409 Conflict`.
* Cancelling an already cancelled reservation returns `409 Conflict`.

**Edge cases:**

* A slot exists but does not have enough available seats.
* A slot looked available in the frontend but capacity changed before creation.
* A reservation is created for a valid date but an invalid time slot.
* A reservation is created for today with a past time.
* A cancelled reservation is cancelled again.
* A user tries to read or cancel another user's reservation.
* Availability must include seeded booked slots and confirmed reservations, but ignore cancelled reservations.

**Tests:**

* Creates a confirmed reservation when the slot has enough available seats.
* Rejects overbooking with `409 Conflict`.
* Rejects reservation creation in the past.
* Rejects reservation creation for a time outside generated slots.
* Rejects creation when seeded booked slots leave insufficient seats.
* Lists only reservations owned by the authenticated user.
* Orders listed reservations by creation time descending.
* Cancels an owned confirmed reservation and sets `cancelledAt`.
* Returns `409 Conflict` when cancelling an already cancelled reservation.
