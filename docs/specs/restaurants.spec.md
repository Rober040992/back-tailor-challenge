# Restaurants CRUD

## Restaurant response

Restaurant responses include:

```txt
id
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
createdAt
updatedAt
```

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
```

Returns `201 Created` with the created restaurant response.

### `PATCH /restaurants/:id`

Accepts a partial payload containing only fields accepted by
`POST /restaurants`.

Returns `200 OK` with the updated restaurant response.

Returns `404 Not Found` when the restaurant does not exist.

### `DELETE /restaurants/:id`

Returns `204 No Content` with an empty response body.

Returns `404 Not Found` when the restaurant does not exist.
