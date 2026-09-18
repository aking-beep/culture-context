# Culture Context MVP

## User capability

A traveler can enter who they are, where they are going, and what they plan to do, then receive a short destination brief made only from cited source records with clear provenance and freshness.

## In scope

- traveler profile: nationality, residence, destination, city, dates, purpose, activities
- GOV.UK structured foreign-travel-advice adapter as the first official advisory source
- normalized source records
- deterministic applicability ranking
- categories: entry, law/restriction, safety, culture/context
- every card shows source authority, source class, retrieved time, and canonical URL
- unavailable/failed-source state is visible
- Next.js mobile-first UI at `apps/culture`
- FastAPI service at `culture/`

## Explicitly out of scope

- claiming comprehensive legal coverage
- visa approval decisions
- legal advice
- background location tracking
- automatic geofencing
- push notifications
- user accounts/payments
- crowd-sourced claims shown as law
- LLM-generated legal rules

## Acceptance criteria

1. `POST /v1/brief` accepts a valid traveler profile and returns a typed brief.
2. The service can ingest structured GOV.UK travel-advice content for a destination slug.
3. If the source is unavailable, the response still succeeds with a source-status warning and no invented facts.
4. Each returned item includes at least one source reference.
5. The app distinguishes source class (primary law vs government advisory vs context) and never upgrades one to another.
6. Activity matching is deterministic and unit-tested.
7. The UI exposes the sources without requiring an AI explanation.
8. AI explanation is an optional, separate endpoint and must be able to be disabled entirely.
9. Python tests and Next typecheck pass.
10. No existing ARK product behavior changes.

## Kill criteria

Do not expand beyond five launch countries until users repeatedly open source details or save trip briefs. If the value proposition collapses to generic destination summaries, stop and revisit the product rather than adding more countries.
