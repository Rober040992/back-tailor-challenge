# Rate Limiter Spec

## Scope

Add a simple global HTTP rate limiter shared by all controllers.

## Requirements

* Every HTTP request counts toward the limit.
* The limit is 30 requests per minute per client IP.
* Request 31 within the same minute starts a 2-minute penalty for that client IP.
* During the penalty, every endpoint must return `429 Too Many Requests`.
* Requests made during the penalty must not extend the penalty.
* After the penalty expires, the counter resets for that client IP.
* Rate limit responses must include a `Retry-After` header with the remaining penalty seconds.
* Rate limit errors must use the standard API error response shape.
* The implementation must not require database changes.
* The implementation must not add a new dependency.

## Out of scope

* User-specific limits.
* Route-specific limits.
* Distributed rate limiting.
* Persistent rate limit storage.
