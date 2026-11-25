# Review rubric

Five binary points. No halves. Nothing ships below 5/5.

1. **Spec satisfied** — every acceptance criterion is met as written.
2. **Evidence proves it** — comparable before/after artifacts demonstrate the change.
3. **Structure holds** — edge → service → adapter, declared dependencies, no provider/database calls from UI edges.
4. **Fails safely** — timeouts, validation, visible failure states, consistent writes; AI calls need bounded cost/fallback or explicit no-fallback rationale.
5. **Readable** — names explain intent, tests cover material logic, no dead/debug code.

A withheld point names a file/line and a concrete remediation. Reviewer does not patch code.
