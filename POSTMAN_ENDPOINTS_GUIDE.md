# Postman Endpoint Guide

Compact reference for every implemented API endpoint. Contracts follow the controllers, DTOs, feature specs, and `constitution.back.md`.

## Setup

Create a Postman environment:

```txt
baseUrl = http://localhost:3000
```

Use `Body -> raw -> JSON` for JSON requests.

Protected routes use the `access_token` HttpOnly cookie:

1. Call `POST {{baseUrl}}/auth/login`.
2. Keep Postman's cookie jar enabled.
3. Call `GET {{baseUrl}}/auth/me` in the same session to verify the cookie.
4. Call other protected routes in the same session.
5. Call logout to clear the cookie.

Do not use a Bearer token. Seed users are `roberto`, `lautaro`, `nico`, and `aida`; all use password `12345`.

## Shared contracts

### Error

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed.",
  "path": "/reservations",
  "timestamp": "2026-06-21T10:00:00.000Z",
  "details": [
    {
      "field": "partySize",
      "message": "partySize must not be less than 1"
    }
  ]
}
```

`details` is optional. Unknown JSON fields return `400`.

| Status | Meaning                                      |
| ------ | -------------------------------------------- |
| `400`  | Invalid path, query, or body                 |
| `401`  | Missing or invalid login cookie              |
| `403`  | Authenticated user does not own the resource |
| `404`  | Resource does not exist                      |
| `409`  | Duplicate, capacity, or state conflict       |

### Restaurant

```json
{
  "id": 1,
  "ownerId": 1,
  "name": "Mission Chinese Food",
  "neighborhood": "Manhattan",
  "address": "171 E Broadway, New York, NY 10002",
  "lat": 40.713829,
  "lng": -73.989667,
  "image": "https://example.com/image.jpg",
  "photograph": "1.jpg",
  "cuisineType": "Asian",
  "description": "Restaurant description.",
  "capacity": 72,
  "operatingHours": {},
  "reservationSettings": {},
  "averageRating": 4,
  "commentsCount": 3,
  "canEdit": true,
  "createdAt": "2026-06-21T10:00:00.000Z",
  "updatedAt": "2026-06-21T10:00:00.000Z"
}
```

`averageRating` is calculated from comments and is `null` when there are none. `canEdit` is `true` only for the authenticated owner.

### Reservation

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

### Comment

```json
{
  "id": 1,
  "restaurantId": 1,
  "userId": 1,
  "name": "roberto",
  "date": "2026-06-21",
  "rating": 4,
  "body": "Great food and service.",
  "createdAt": "2026-06-21T10:00:00.000Z",
  "updatedAt": "2026-06-21T10:00:00.000Z"
}
```

## Authentication

| Method and URL                   | Access    | Body                | Success                       | Errors       |
| -------------------------------- | --------- | ------------------- | ----------------------------- | ------------ |
| `POST {{baseUrl}}/auth/register` | Public    | Register JSON below | `201`, registered user JSON   | `400`, `409` |
| `POST {{baseUrl}}/auth/login`    | Public    | Login JSON below    | `200`, user JSON, sets cookie | `400`, `401` |
| `GET {{baseUrl}}/auth/me`        | Protected | None                | `200`, current user JSON      | `401`        |
| `POST {{baseUrl}}/auth/logout`   | Protected | None                | `204`, clears cookie          | `401`        |

Register request:

```json
{
  "email": "new-user@example.com",
  "username": "new-user",
  "password": "12345"
}
```

Register response:

```json
{
  "id": 5,
  "email": "new-user@example.com",
  "username": "new-user",
  "createdAt": "2026-06-21T10:00:00.000Z",
  "updatedAt": "2026-06-21T10:00:00.000Z"
}
```

Registration creates the user but does not set the authentication cookie. Log in after registration to authenticate.

Login request:

```json
{
  "username": "roberto",
  "password": "12345"
}
```

Login response:

```json
{
  "id": 1,
  "username": "roberto"
}
```

Current user response:

```json
{
  "id": 1,
  "email": "roberto@example.com",
  "username": "roberto"
}
```

Invalid credentials always return `Invalid username or password.` Missing, invalid, or expired cookies on `GET /auth/me` and `POST /auth/logout` return the shared `401` error shape.

If `GET {{baseUrl}}/auth/me` returns `404 Cannot GET /auth/me`, restart the NestJS dev server or rebuild before `npm run start:prod`; that response means the running process does not have the current route loaded.

## Restaurants

| Method and URL                     | Access    | Body                    | Success                 | Errors                     |
| ---------------------------------- | --------- | ----------------------- | ----------------------- | -------------------------- |
| `GET {{baseUrl}}/restaurants`      | Public    | None                    | `200`, restaurant array | None                       |
| `GET {{baseUrl}}/restaurants/1`    | Public    | None                    | `200`, restaurant       | `400`, `404`               |
| `POST {{baseUrl}}/restaurants`     | Protected | Restaurant JSON         | `201`, restaurant       | `400`, `401`               |
| `PATCH {{baseUrl}}/restaurants/1`  | Protected | Partial restaurant JSON | `200`, restaurant       | `400`, `401`, `403`, `404` |
| `DELETE {{baseUrl}}/restaurants/1` | Protected | None                    | `204`                   | `400`, `401`, `403`, `404`, `409` |

Create body:

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
      }
    ],
    "bookedSlots": []
  }
}
```

Create requires only `name`, `address`, and `description`; other fields are optional and receive defaults. Update accepts any subset.

- `lat` and `lng`: numbers.
- `capacity`: integer.
- `operatingHours` and `reservationSettings`: objects.
- `ownerId` is set from the login cookie and is rejected in request bodies.
- Delete returns `409` when related comments, favourites, or reservations exist.
- Only the owner may update or delete a restaurant; otherwise `403`.

## Availability

```http
GET {{baseUrl}}/restaurants/1/availability?date=2026-07-10&partySize=4
```

Access: public.

Query:

- `date`: required real `YYYY-MM-DD`, today or later.
- `partySize`: required integer from `1` to `99`.

Response:

```json
{
  "restaurantId": 1,
  "date": "2026-07-10",
  "slots": [
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

Success: `200`. Errors: `400`, `404`.

All generated slots are returned. Seeded booked seats and confirmed reservations reduce capacity; cancelled reservations do not. This endpoint does not create reservations.

## Reservations

All routes are protected and use the authenticated user from the cookie.

| Method and URL                            | Body              | Success                      | Errors                            |
| ----------------------------------------- | ----------------- | ---------------------------- | --------------------------------- |
| `POST {{baseUrl}}/reservations`           | Create JSON below | `201`, reservation           | `400`, `401`, `404`, `409`        |
| `GET {{baseUrl}}/me/reservations`         | None              | `200`, reservation array     | `401`                             |
| `GET {{baseUrl}}/reservations/1`          | None              | `200`, reservation           | `400`, `401`, `403`, `404`        |
| `PATCH {{baseUrl}}/reservations/1/cancel` | None              | `200`, cancelled reservation | `400`, `401`, `403`, `404`, `409` |

```json
{
  "restaurantId": 1,
  "date": "2026-07-10",
  "time": "13:30",
  "partySize": 4
}
```

- `restaurantId`: positive integer.
- `date`: real `YYYY-MM-DD`.
- `time`: 24-hour `HH:MM`.
- `partySize`: integer from `1` to `99`.
- UTC date/time cannot be in the past.
- Time must match a generated slot.
- `userId`, `status`, and unknown fields are rejected.
- Capacity is recalculated during creation; insufficient capacity returns `409`.
- Lists contain only the current user's reservations, newest first.
- Reading or cancelling another user's reservation returns `403`.
- Cancelling twice returns `409`; cancellation releases capacity.
- `reservationId` must be an integer from `1` to `99999`.

## Favourites

All routes are protected and scoped to the authenticated user.

| Method and URL                       | Body | Success                    | Errors                     |
| ------------------------------------ | ---- | -------------------------- | -------------------------- |
| `GET {{baseUrl}}/me/favourites`      | None | `200`, `{ "results": [] }` | `401`                      |
| `POST {{baseUrl}}/me/favourites/1`   | None | `201`, favourite           | `400`, `401`, `404`, `409` |
| `DELETE {{baseUrl}}/me/favourites/1` | None | `204`                      | `400`, `401`, `404`        |

Favourite response:

```json
{
  "id": 1,
  "restaurantId": 1,
  "createdAt": "2026-06-21T10:00:00.000Z",
  "restaurant": {}
}
```

`restaurant` is the complete shared restaurant response.

- `restaurantId` must be a positive integer.
- Results are ordered by `createdAt`, then favourite `id`, descending.
- Duplicate favourites return `409`.
- Removing a missing or unowned favourite returns `404`.
- Removing a favourite does not delete the restaurant.

## Comments

| Method and URL                            | Access    | Body         | Success                    | Errors                     |
| ----------------------------------------- | --------- | ------------ | -------------------------- | -------------------------- |
| `GET {{baseUrl}}/restaurants/1/comments`  | Public    | None         | `200`, `{ "results": [] }` | `400`, `404`               |
| `POST {{baseUrl}}/restaurants/1/comments` | Protected | Create JSON  | `201`, comment             | `400`, `401`, `404`        |
| `PATCH {{baseUrl}}/comments/1`            | Protected | Partial JSON | `200`, comment             | `400`, `401`, `403`, `404` |
| `DELETE {{baseUrl}}/comments/1`           | Protected | None         | `204`                      | `400`, `401`, `403`, `404` |

Create body:

```json
{
  "rating": 4,
  "body": "Great food and service."
}
```

Update body:

```json
{
  "rating": 5,
  "body": "Updated review."
}
```

- IDs must be positive integers.
- `rating`: integer from `1` to `5`.
- `body`: non-whitespace string, maximum 1000 characters.
- Update requires `rating`, `body`, or both.
- The server generates `userId`, `name`, and current UTC `date`.
- Only the author may update or delete; otherwise `403`.
- Listing an existing restaurant without comments returns an empty `results`.

## Suggested test order

1. Login.
2. Get the current authenticated user with `GET {{baseUrl}}/auth/me`.
3. List and read restaurants.
4. Check availability.
5. Create, list, read, and cancel a reservation.
6. Add, list, and remove a favourite.
7. List, create, update, and delete a comment.
8. Create, update, and delete an owned restaurant without related records.
9. Logout.

Useful Postman variables:

```txt
restaurantId
reservationId
commentId
```
