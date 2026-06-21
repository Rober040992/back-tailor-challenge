## Spec: Favourites

**Goal:**

Allow users to add, list and remove their favourite restaurants.

**Endpoint(s):**

```txt
GET    /me/favourites
POST   /me/favourites/:restaurantId
DELETE /me/favourites/:restaurantId
```

**Input:**

`POST /me/favourites/:restaurantId` and `DELETE /me/favourites/:restaurantId`
receive `restaurantId` as a path parameter.

No request body is required.

**Output:**

`GET /me/favourites`

Status: `200 OK`

```txt
{
  results: FavouriteResponse[]
}

FavouriteResponse:
  id: number
  restaurantId: number
  createdAt: ISO date-time string
  restaurant: RestaurantResponse
```

`RestaurantResponse` is defined in `docs/specs/restaurants.spec.md`.

Results must be ordered by `createdAt` descending, then by `id` descending.

`POST /me/favourites/:restaurantId`

Status: `201 Created`

Returns `FavouriteResponse`.

`DELETE /me/favourites/:restaurantId`

Status: `204 No Content`

**Business rules:**

* A restaurant must exist before it can be added as favourite.
* A duplicate favourite returns `409 Conflict`.
* Removing a favourite deletes only the favourite relation, not the restaurant.
* Removing a favourite that does not exist for the current user returns `404 Not Found`.

**Validation:**

* `restaurantId` must be a positive integer.
* Invalid `restaurantId` returns `400 Bad Request`.
* A non-existing restaurant returns `404 Not Found`.

**Edge cases:**

* Listing favourites with no saved restaurants returns an empty `results` array.

**Tests:**

* Reject unauthenticated requests.
* Add a restaurant to favourites.
* Prevent duplicated favourites.
* List only the authenticated user's favourites.
* List favourites ordered by `createdAt` descending, then by `id` descending.
* Return an empty `results` array when the user has no favourites.
* Remove an existing favourite.
* Return `404 Not Found` when removing a favourite that does not exist.
* Return `404 Not Found` when adding a non-existing restaurant.
* Return `400 Bad Request` for invalid `restaurantId`.
