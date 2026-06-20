## Spec: Availability

**Goal:**

Allow users to check available reservation slots for one restaurant on one specific date and party size.

**Endpoint(s):**

GET /restaurants/:restaurantId/availability?date=YYYY-MM-DD&partySize=4

**Input:**

Path params:

restaurantId: number

Query params:

date: string
partySize: number

**Output:**

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

**Business rules:**

- Availability is calculated on demand for one restaurant and one date.
- Slots are generated from `restaurant.reservationSettings.serviceWindows`.
- Slot duration is defined by `restaurant.reservationSettings.slotIntervalMinutes`.
- Slot capacity is defined by `restaurant.reservationSettings.defaultSlotCapacity`.
- Service window start time is included.
- Service window end time is excluded.
- Seeded `bookedSlots` reduce available seats when restaurant, date and time match.
- Confirmed reservations reduce available seats when restaurant, date and time match.
- Cancelled reservations must not reduce available seats.
- `reservedSeats` is the sum of matching seeded booked seats and matching confirmed reservation party sizes.
- `availableSeats` is calculated as `capacity - reservedSeats`.
- `availableSeats` must never be returned below `0`.
- `available` is `true` only when `availableSeats >= partySize`.
- The endpoint returns all generated slots, including unavailable slots.
- The endpoint does not create reservations.
- The endpoint does not update reservations.
- The endpoint does not mutate `reservationSettings.bookedSlots`.

**Validation:**

- `restaurantId` must reference an existing restaurant.
- `date` is required.
- `date` must use `YYYY-MM-DD`.
- `partySize` is required.
- `partySize` must be greater than `0`.

**Edge cases:**

- If the selected date has no bookings, return generated slots with full capacity.
- If a slot is fully booked, return `availableSeats: 0` and `available: false`.
- If existing reserved seats exceed slot capacity, return `availableSeats: 0`.
- If the restaurant does not exist, return `404`.
- If `date` or `partySize` is missing or invalid, return `400`.

**Tests:**

- Generates lunch and dinner slots from restaurant reservation settings.
- Excludes the service window end time.
- Applies seeded booked slots.
- Applies confirmed reservations.
- Ignores cancelled reservations.
- Returns full-capacity slots for a date without bookings.
- Marks a slot as available when `availableSeats >= partySize`.
- Marks a slot as unavailable when `availableSeats < partySize`.
- Returns `400` when `date` is missing.
- Returns `400` when `partySize` is missing.
- Returns `400` when `partySize` is less than or equal to `0`.
- Returns `404` when the restaurant does not exist.