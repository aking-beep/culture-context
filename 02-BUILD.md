# Step 2 — Build

The dependency direction is fixed:

```text
edge → service → adapter
```

Edge parses/render inputs and calls one service function. Services own testable business logic and do not import framework request/response types. Adapters are the only place third-party clients are constructed.

Rules: implement the smallest spec; declare new dependencies; prefer deterministic logic to model logic; handle errors where action is possible; never commit secrets; write tests in the same pass; declare spec deviations in evidence.

Culture Context-specific rules in `PROJECT.md` are mandatory.
