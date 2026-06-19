# Review Constitution Compliance

You must review whether the current implementation follows the repository constitution.

Do not modify files.
Do not suggest unrelated improvements.
Do not add new features.

## Required reading

1. Read the repository constitution:
   - `constitution.back.md` if this is the backend repository.
   - `constitution.front.md` if this is the frontend repository.
2. Read `AGENTS.md`.

## Review scope

Review only the files related to the current task:

`<task-or-files>`

## Compliance checklist

Check:

- Source hierarchy is respected
- Approved spec exists if required
- No unrelated files were changed
- No unapproved features were added
- Naming rules are respected
- Architecture rules are respected
- Auth rules are respected if relevant
- Ownership rules are respected if relevant
- Error handling rules are respected if relevant
- Testing rules are respected
- Out-of-scope items were not introduced

## Output format

Return:

- Compliant items
- Violations
- Missing evidence
- Required fixes
- Final verdict: `PASS` or `FAIL`

Do not fix anything unless explicitly requested.