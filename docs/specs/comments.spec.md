## Spec: Comments

**Goal:**

Allow users to read restaurant comments publicly and allow authenticated users to create, update and delete their own comments.

**Endpoint(s):**

```txt
GET    /restaurants/:restaurantId/comments
POST   /restaurants/:restaurantId/comments
PATCH  /comments/:commentId
DELETE /comments/:commentId
```

**Input:**

`GET /restaurants/:restaurantId/comments`

```txt
Path params:
restaurantId: number
```

`POST /restaurants/:restaurantId/comments`

```txt
Path params:
restaurantId: number

Body:
{
  "rating": number,
  "body": string
}
```

`PATCH /comments/:commentId`

```txt
Path params:
commentId: number

Body:
{
  "rating"?: number,
  "body"?: string
}
```

`DELETE /comments/:commentId`

```txt
Path params:
commentId: number
```

**Output:**

Comment response:

```json
{
  "id": 1,
  "restaurantId": 1,
  "userId": 1,
  "name": "roberto",
  "date": "2026-06-21",
  "rating": 4,
  "body": "Great food and good service.",
  "createdAt": "2026-06-21T10:00:00.000Z",
  "updatedAt": "2026-06-21T10:00:00.000Z"
}
```

List response:

```json
{
  "results": []
}
```

**Business rules:**

* Comments belong to one restaurant and one user.
* Reading comments is public.
* Creating comments requires authentication.
* Updating comments requires authentication.
* Deleting comments requires authentication.
* A comment must be created using the authenticated user as author.
* `userId`, `name` and `date` must be generated server-side.
* `date` must be generated server-side using the current UTC date in `YYYY-MM-DD` format.
* Only the comment author can update a comment.
* Only the comment author can delete a comment.
* Restaurant rating must continue to be calculated from comments, not stored as a mutable restaurant field.

**Validation:**

* `restaurantId` must be a valid numeric id.
* `commentId` must be a valid numeric id.
* `rating` is required when creating a comment.
* `rating` must be an integer between 1 and 5.
* `body` is required when creating a comment.
* `body` must be a non-empty string.
* `body` should not exceed 1000 characters.
* Update body must include at least one valid editable field.

**Edge cases:**

* Return `404 Not Found` if the restaurant does not exist.
* Return `404 Not Found` if the comment does not exist.
* Return `401 Unauthorized` if an unauthenticated user tries to create, update or delete a comment.
* Return `403 Forbidden` if an authenticated user tries to update or delete another user's comment.
* Return `400 Bad Request` for invalid input.

**Tests:**

* Should list comments for an existing restaurant.
* Should return an empty list when the restaurant has no comments.
* Should create a comment for the authenticated user.
* Should reject comment creation without authentication.
* Should reject invalid rating values.
* Should allow the comment author to update a comment.
* Should reject update by a different authenticated user.
* Should allow the comment author to delete a comment.
* Should reject delete by a different authenticated user.
