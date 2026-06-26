# AI Usage Notes

This AI usage documentation is kept in a separate file for organization. The README can link to this file instead of including the full notes inline.

The goal of this document is to describe honestly how AI was used during the project: where it supported my work, what I reviewed or corrected, what I rejected, and which parts still required my own validation.

## AI-Assisted Development Workflow

My development process followed a Spec-Driven Development approach.

AI was not the source of truth. Before planning or implementation, any AI-supported output had to stay aligned with the project constitution, which I used as the main rule set for each repository.

Codex worked as the main implementation assistant inside this workflow.

After the constitution, the work had to follow the relevant `AGENTS.md` instructions, then the approved feature spec, then the scoped task.

The repository-level `constitution` and `AGENTS.md` files were kept in the root of each project, while feature specs and reusable skills were kept under `/docs`.

The backend was implemented first to stabilize the data model, API contracts, authentication, authorization, availability, and reservation business rules. The frontend was implemented afterwards against those stable backend contracts.

My usual workflow was:

1. Review the constitution and repository rules.
2. Review or create the feature spec.
3. Define the API contract, UI behavior, business rules, and risks.
4. Define a scoped implementation plan.
5. Review and approve the plan before accepting changes.
6. Implement only the approved scope.
7. Validate the result with available checks such as lint, build, tests, Docker runs, or manual API/browser verification. Backend behavior was usually checked with Postman.
8. Review the output again and reject, correct, or simplify anything that did not match the approved scope.

This workflow helped reduce AI risks such as hallucinated requirements, incorrect API contracts, overengineering, unrelated file changes, and frontend/backend contract drift.

## Tools Used

AI tools were part of the development workflow as support for planning checks, implementation assistance, refactoring suggestions, documentation drafting, and validation checklists.

Codex was the main AI implementation assistant for scoped backend and frontend tasks.

ChatGPT supported project organization, documentation generation, reasoning review, implementation advice, library usage checks, and risk identification.

The `ui-shadcn-tailwind-v4` UI skill helped speed up frontend UI work while respecting the existing design direction and avoiding unnecessary new libraries.

Notion was my non-AI organization tool for managing the project workflow. It was used for task tracking, to-do lists, feature notes, bug and fix notes, initial technical decisions, backend and frontend roadmap planning, error format decisions, database logic notes, UI decisions, and feature-level workflow documentation.

Notion was not the source of truth for implementation. Final implementation decisions were validated against the project constitution, `AGENTS.md`, approved specs, and the actual backend/frontend code.

## Backend

AI support was useful for backend work around NestJS, Prisma, PostgreSQL, JWT authentication with HttpOnly cookies, restaurants CRUD, availability, reservations, favourites, comments, logging, rate limiting, Docker, and deployment documentation.

I reviewed backend API contracts, business rules, error handling, ownership logic, database decisions, and deployment assumptions before accepting changes.

The backend remained the source of truth for authentication, ownership, availability, reservation capacity, and reservation status.

I corrected or rejected AI suggestions when they introduced wrong assumptions, unnecessary abstractions, frontend-only ownership checks, duplicated derived data, new dependencies, or changes outside the approved scope.

Concrete fixes created during the process included ownership checks for restaurant updates/deletes, backend-calculated `canEdit`, past-date validation for availability, handling missing comments during updates, reservation availability recalculation, safer deployment migration behavior, production-aware cookie configuration, and scoped rate limiting.

Backend changes were validated with manual review and, where applicable, Prisma commands, lint checks, builds, unit tests, and e2e tests.

## Frontend

AI support was useful for frontend work around Next.js, Tailwind CSS, SWR, shared API access, auth state, restaurant list/detail pages, availability flow, reservation creation, favourites, comments, the account page, maps, responsive UI states, Docker, and deployment proxying.

Frontend behavior was reviewed against real backend responses, authentication rules, ownership rules, UI scope, loading states, error states, and deployment environment behavior.

JWT handling stayed out of frontend storage, authenticated requests used `credentials: "include"`, backend-driven ownership rules were preserved, and the UI was not treated as the source of truth for business logic.

I corrected AI output when it assumed the wrong response shape, calculated availability in the frontend, used incorrect ownership logic, added unnecessary abstractions, or expanded the UI beyond the approved feature scope.

Concrete fixes created during the process included the auth provider flow based on `/auth/me`, dropdown logout behavior, restaurant comments response handling, favourite toggle behavior, availability slot contract alignment, my-account reservation/favourite actions, map fallback handling for missing coordinates, and runtime backend proxy configuration for deployment.

Frontend changes were validated with manual review and, where applicable, lint checks, builds, Docker checks, and local HTTP checks. Some UI and deployed behaviors still required manual browser/API verification.

## Main Limitations and Risks

The main risks I identified were hallucinated requirements, incorrect API contract assumptions, overengineering simple features, unrelated file changes, frontend/backend contract drift, missing edge cases, and code that still required targeted manual verification.

Particular care was needed around reservation capacity, availability calculation, ownership checks, authentication cookies, deployment environment variables, Prisma generated types, and runtime behavior in local versus deployed environments.

AI output was not treated as final by default. I reviewed, corrected, narrowed in scope, and validated it before accepting it into the project.

## Not Claimed

I only include implemented changes, fixes, and validations when they were clearly reviewed or verified during the project.

Some browser flows, deployed behavior, and full end-to-end scenarios still required manual verification when they were not explicitly covered by automated checks.
