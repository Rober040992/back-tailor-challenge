# Backend Dockerization Spec

## Goal

Add Docker support for the backend so the API can run locally with PostgreSQL through Docker Compose.

The Dockerfile must also be reusable for future backend deployment where environment variables are provided externally.

## Scope

Create or update only:

- `Dockerfile`
- `.dockerignore`
- `docker-compose.yml`
- `.env.example`, only if Docker-specific local values need clarification
- `README.md`, only if Docker commands are needed

## Requirements

### Dockerfile

- Build the NestJS backend with npm.
- Generate Prisma Client during the image build.
- Run the compiled application with `npm run start:prod`.
- Do not hardcode local database credentials or deployment secrets.
- Read runtime configuration from environment variables.
- Be suitable for future deployment without requiring `docker-compose.yml`.

### docker-compose.yml

- Be intended for local development only.
- Define a PostgreSQL service for local backend development.
- Define a backend service that connects to the local PostgreSQL service through `DATABASE_URL`.
- Expose the backend using the configured `PORT`.
- Persist PostgreSQL data with a named Docker volume.
- Do not include frontend, Redis, Nginx, deployment platform config, or unrelated services.

### Environment

- Local Compose may provide development-safe defaults for:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `PORT`
  - `FRONTEND_URL`
  - `SWAGGER_ENABLED`
- Future production deployment must provide environment variables externally.
- Future production deployment must not depend on the local PostgreSQL Compose service.

### Prisma and seed

- Do not change Prisma models.
- Do not add or modify migrations.
- Do not change seed logic.
- README Docker commands may include how to run migrations and seed inside the backend container.

### README Docker commands

If README changes are needed, document only local Docker commands such as:

```txt
docker compose up --build
docker compose exec api npx prisma migrate dev
docker compose exec api npm run seed
docker compose down
```

## Out of scope

- Source code changes
- API contract changes
- Prisma schema changes
- Migration changes
- Seed logic changes
- Endpoint changes
- Test changes
- Swagger changes
- Frontend Docker support
- Redis
- Nginx
- Deployment platform files
- Production database provisioning
