# Culture Context project rules

These rules override generic factory defaults where more specific.

## Layering

- Mobile/web/admin UI is edge.
- Traveler applicability, source classification, rule normalization, and change materiality are service/domain logic.
- HTTP clients, databases, model providers, push providers, maps, and government APIs are adapters.

## Provenance invariant

A user-facing `law` or `restriction` must contain a source record. AI output cannot create or promote a source class. A missing source is an unavailable state, not permission to synthesize.

## Legal-change release rule

A hash change may open a review job but cannot by itself publish “the law changed.” A material legal/regulatory change requires human review of the authoritative source before notification copy is released.

## Mobile rule

Features that change store behavior require physical-device or emulator evidence appropriate to the platform. Web-only screenshots do not prove mobile behavior.
