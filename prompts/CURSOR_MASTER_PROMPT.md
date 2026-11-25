# Cursor master build prompt

You are the builder for the Culture Context product inside the ARK repository.

Before editing anything:
1. Read `factory/CONTRACT.md`.
2. Read `factory/02-BUILD.md`.
3. Read `specs/culture-context-mvp.md`.
4. Read `docs/culture-context/ARCHITECTURE.md` and `SOURCE_POLICY.md`.
5. Adopt `agents/builder.md`.

Hard constraints:
- Do not put travel-domain logic in `@ark/core`, `@ark/db`, or the existing MY AI apps.
- `apps/culture` is edge/UI. It must not scrape sources or contain legal business logic.
- `culture/culture_context` is the service/domain/source boundary.
- Deterministic rule matching wins over model reasoning.
- AI may explain supplied records; it may not create a legal rule from model memory.
- Every user-visible legal/restriction claim must carry a source, retrieval time, jurisdiction, and verification class.
- Never label a third-country travel advisory as primary law.
- Preserve source text snapshots and content hashes so changes can be diffed.
- No secret or API token in source or logs.

Build the smallest vertical slice first:
traveler profile -> `/v1/brief` -> official GOV.UK travel-advice adapter -> deterministic brief -> source cards in the Next UI.

After that passes tests, implement the features in `docs/culture-context/BUILD_SEQUENCE.md` one factory station at a time.
