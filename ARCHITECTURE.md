# Culture Context architecture

## Boundary

Culture Context is a new domain. It borrows ARK's software-factory discipline and optional runtime, not ARK's AI-fit business logic.

```text
apps/culture (Next.js)
      |
      | POST /v1/brief
      v
culture/ FastAPI service
  edge: api.py
  service: service.py / applicability.py
  adapters: sources/*
      |
      +--> official structured feeds/APIs
      +--> source snapshots + normalized records (phase 2 DB)

optional explanation path
apps/culture -> @ark/runtime -> Ollama / Bedrock / OpenAI-compatible
                       |
                       +--> ARK Control telemetry later
```

## Core rule

Facts and model prose have different authority.

- `RuleRecord`: deterministic, sourced, dated, typed.
- `BriefItem`: deterministic selection of a RuleRecord for a traveler profile.
- `Explanation`: optional prose generated from one or more BriefItems.

The UI must never render `Explanation` in the visual slot used for a sourced fact without labeling it as an explanation.

## Production persistence

Development can run without a DB. Phase 2 should use Postgres with these logical tables:

- `sources`
- `source_snapshots`
- `rules`
- `rule_sources`
- `jurisdictions`
- `trips`
- `subscriptions`
- `changes`
- `verification_events`

Use PostGIS only when local/geofenced rules are proven necessary. Do not add geographic complexity before there is a city-level source corpus to justify it.

## AI path

Use `@ark/runtime` from the Next server, not from Python, so the existing provider policy, local-only option, fallback behavior, evals, and telemetry remain reusable. The prompt receives only curated records and citations.

AI tasks that are allowed:
- plain-language explanation
- home-vs-destination comparison wording
- summarizing a verified source record
- clustering source changes for editorial review

AI tasks that are not allowed:
- creating a law from model memory
- deciding whether a user is legally admissible
- silently changing a source class
- inventing dates, penalties, thresholds, or exceptions
