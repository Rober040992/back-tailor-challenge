## Spec: Backend Critical Tests

**Goal:**

Keep only critical backend tests for implemented functionality.

**Scope:**

- Unit tests for core business logic.
- End-to-end tests for critical public API flows.
- All implemented backend feature modules.

**Critical test criteria:**

Keep tests that protect:

- Authentication and session behaviour.
- Authorization and ownership rules.
- Core create, read, update, delete and cancellation flows.
- Reservation capacity and overbooking rules.
- Public response contracts used by the frontend.
- Main business errors: `401`, `403`, `404`, `409` and one representative validation error per critical flow.

**Out of scope:**

- Exact response key ordering tests.
- Exhaustive invalid id tests.
- Exhaustive validation permutations.
- Ordering tests unless ordering is part of the critical user flow.
- Logging-only tests.
- Swagger-only tests.
- Duplicate coverage between unit and e2e tests when one critical test already protects the behaviour.
- Tests for non-critical enriched response details.
- Backend implementation changes unless a remaining critical test exposes a real bug.

**Unit test scope:**

- Auth service critical registration and login behaviour.
- Restaurants service rating and ownership behaviour.
- Availability service slot and capacity behaviour.
- Reservations service creation, capacity, ownership listing and cancellation behaviour.
- Favourites service duplicate, create and remove behaviour.
- Comments service create, author update/delete and ownership rejection behaviour.

**E2E test scope:**

- Auth register, login, current user and logout flows.
- Restaurant public reads, auth requirement and owner CRUD flow.
- Availability generated slots, representative validation and missing restaurant.
- Reservation create, overbooking, owned list/detail, cancel and cancelled conflict flows.
- Favourite auth, add, duplicate, owned list and remove flows.
- Comment list, empty list, create, auth, representative validation, author update/delete and ownership rejection flows.

**Assertion rules:**

- Use partial object assertions for public response contracts when extra fields are allowed.
- Do not require exact response key lists unless a feature spec explicitly requires exact keys only.
- Prefer one representative validation test over all invalid input permutations.
