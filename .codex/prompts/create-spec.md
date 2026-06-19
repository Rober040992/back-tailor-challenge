# Create Feature Spec

You must create a feature spec only.

Do not write code.
Do not modify source files.
Do not create implementation files.
Do not invent requirements.

## Required reading

1. Read the repository constitution:
   - `constitution.back.md` if this is the backend repository.
   - `constitution.front.md` if this is the frontend repository.
2. Read `AGENTS.md`.
3. Read any existing related specs in `docs/specs/`.

## Task

Create a spec for this feature:

`<feature-name>`

## Output file

Create or update only this file:

`docs/specs/<feature-name>.spec.md`

## Required spec format

The spec must include:

- Feature name
- Purpose
- Scope
- Out of scope
- Endpoints or screens affected
- Input contract
- Output contract
- Business rules
- Validation rules
- Error cases
- Ownership or auth rules if relevant
- Test cases
- Implementation notes
- Open questions

## Rules

- Keep the spec clear and strict.
- Do not add features outside the task.
- Do not make architecture decisions unless already defined.
- If a requirement is unclear, write it under `Open questions`.
- Open questions, if any
- If there are no open questions, write `None`.
- The spec must be ready for approval before implementation.
- Keep the spec short.
- Do not repeat constitution rules.
- Do not repeat AGENTS.md rules.
- Include only feature-specific requirements.
- Do not create broad or generic sections.
- Read only the files directly needed for this spec.