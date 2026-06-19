# Review Against Spec

You must review the current implementation against an approved spec.

Do not modify files unless explicitly asked.
Do not suggest unrelated refactors.
Do not add new requirements.

## Required reading

1. Read the repository constitution:
   - `constitution.back.md` if this is the backend repository.
   - `constitution.front.md` if this is the frontend repository.
2. Read `AGENTS.md`.
3. Read the approved spec:

`<spec-path>`

## Review scope

Check only the implementation related to the spec.

## Review checklist

Report whether the implementation:

- Matches the feature purpose
- Matches the defined scope
- Avoids out-of-scope work
- Matches input contracts
- Matches output contracts
- Enforces business rules
- Handles validation rules
- Handles error cases
- Respects auth and ownership rules if relevant
- Includes relevant tests
- Follows the repository architecture
- Avoids unrelated changes

## Output format

Return:

- Passed checks
- Failed checks
- Missing items
- Risky implementation details
- Recommended fixes

Do not implement fixes unless explicitly requested.