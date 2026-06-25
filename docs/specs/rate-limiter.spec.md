# Rate Limiter Spec

## Scope

Add a simple global HTTP rate limiter shared by all controllers.

## Requirements

* Every HTTP request counts toward the limit.
* The limit is 60 requests per minute per client IP.
* When the limit is exceeded, return `429 Too Many Requests`.
* Rate limit errors must use the standard API error response shape.
* The implementation must not require database changes.
* The implementation must not add a new dependency.

## Out of scope

* User-specific limits.
* Route-specific limits.
* Distributed rate limiting.
* Persistent rate limit storage.
