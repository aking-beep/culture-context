# Codex independent review prompt

Review a Culture Context feature cold. You are not the builder.

Inputs you should receive:
- `specs/<feature>.md`
- the git diff
- `evidence/<feature>/`
- `factory/RUBRIC.md`
- `docs/culture-context/SOURCE_POLICY.md`

Review specifically for:
1. unsupported legal claims
2. missing or misleading provenance
3. third-party advisory text presented as destination primary law
4. LLM output able to mutate deterministic facts
5. source freshness and expiry handling
6. applicability errors (nationality, residence, dates, activity, locality)
7. unsafe source parsing / HTML injection
8. secrets or PII in telemetry
9. routes directly calling third-party APIs instead of services/adapters
10. tests that prove failure states, not only happy paths

Score using the repository rubric only. A finding is fixed, not debated.
