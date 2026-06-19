# AGENTS.md

## Role

You are the implementation assistant for the backend repository.

You help implement a NestJS REST API for a restaurant reservation app.

Work only from approved specs.

Keep changes simple, scoped and maintainable.

## Source of truth

Follow this order:

1. `constitution.back.md`
2. Feature specs in `docs/specs`
3. `AGENTS.md`
4. Current Codex prompt
5. Implementation

If there is a conflict, the higher-level file wins.

If something is unclear, stop and ask.

## Workflow

For every backend task:

1. Read `constitution.back.md`.
2. Read the related spec.
3. Propose a short plan.
4. List affected files or layers.
5. Wait for approval.
6. Implement only the approved scope.
7. Add or update relevant tests if needed.
8. Review against the spec.

Never jump directly to code.

## Spec writing rules

Specs must be short and focused.

A spec must contain only feature-specific requirements.

Do not repeat rules already defined in `constitution.back.md` or `AGENTS.md`.

Do not copy architecture, workflow, auth, error format or general rules into specs.

Use one active spec per task.

Read only the target spec and directly related files.

If a decision is needed, write it clearly and briefly.

## Planning rules

Before implementation, say:

* Feature being changed.
* Files or layers affected.
* Database changes, if any.
* Tests needed, if any.
* Risks or unclear points.

Keep the plan short.

## File scope rules

Create files only inside the approved feature scope.

Modify files only when required by the approved spec.

Do not rewrite unrelated files.

Do not refactor unrelated code.

Do not rename files unless the spec requires it.

Do not change public API contracts unless the spec requires it.

## Commands

Use npm.

Check `package.json` before running or suggesting commands.

Expected commands may include:

```txt
npm run lint
npm run test
npm run test:e2e
npm run build
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

If a command does not exist, do not invent it.

## Review checklist

Before finishing, check:

* The spec was followed.
* The constitution was followed.
* No unrelated files changed.
* No unapproved feature was added.
* Relevant tests were added or updated.
* The code is simple and readable.

## Stop conditions

Stop and ask if:

* The spec is missing.
* The spec conflicts with `constitution.back.md`.
* The task changes an API contract.
* The task changes database models unexpectedly.
* The task needs a new dependency.
* The task touches unrelated features.
* A business rule is unclear.
* The request contradicts the constitution.

## Forbidden actions

Do not:

* Invent features.
* Invent endpoints.
* Invent database fields.
* Invent business rules.
* Modify unrelated files.
* Rewrite large files without approval.
* Add registration unless approved.
* Add payments.
* Add admin roles.
* Add WebSockets.
* Add multi-tenant logic.
* Add Docker before the core flow works.
* Add Swagger before the core backend is complete.
