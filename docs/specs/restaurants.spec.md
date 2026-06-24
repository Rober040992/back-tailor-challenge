# Restaurants CRUD

## Restaurant response

Restaurant responses include:

```txt
id
ownerId
name
neighborhood
address
lat
lng
image
photograph
cuisineType
description
capacity
operatingHours
reservationSettings
averageRating
commentsCount
canEdit
createdAt
updatedAt
```

`canEdit` is calculated by the backend.

`canEdit` is `true` only when the authenticated user owns the restaurant.

`canEdit` is `false` for unauthenticated users or non-owners.

## Endpoints

### `GET /restaurants`

Returns `200 OK` with an array of restaurant responses.

### `GET /restaurants/:id`

Returns `200 OK` with one restaurant response.

Returns `404 Not Found` when the restaurant does not exist.

### `POST /restaurants`

Requires:

```txt
name
address
description
```

Must not accept:

```txt
ownerId
```

Accepts optionally:

```txt
neighborhood
lat
lng
image
photograph
cuisineType
capacity
operatingHours
reservationSettings
```

When optional fields are missing, the backend assigns:

```txt
neighborhood: ""
lat: 0
lng: 0
image: ""
photograph: image value when image is provided, otherwise ""
cuisineType: ""
capacity: 1
operatingHours: {}
reservationSettings: {}
```

Sets `ownerId` from the authenticated JWT user.

Returns `201 Created` with the created restaurant response.

### `PATCH /restaurants/:id`

Accepts a partial payload containing only fields accepted by
`POST /restaurants`.

Returns `200 OK` with the updated restaurant response.

Returns `404 Not Found` when the restaurant does not exist.

Returns `403 Forbidden` when the authenticated user is not the restaurant owner.

### `DELETE /restaurants/:id`

Returns `204 No Content` with an empty response body.

Returns `404 Not Found` when the restaurant does not exist.

Returns `403 Forbidden` when the authenticated user is not the restaurant owner.
