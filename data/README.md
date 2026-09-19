# Data

- `world-countries.json` ISO country catalog used by the traveler app and API. Names, currency, and driving side are reference data, not law. GOV.UK slugs come from the public travel-advice index.
- `fixtures/` traveler profiles used in tests and local demos. They are not legal advice.
- `seed/rule.example.json` shows the normalized record shape. It must not be loaded into live briefs.
- `snapshots/` SHA-256 source snapshots written at retrieval time. Do not overwrite history.
- `changes/` hash-change review candidates. A new hash is detection, not a published legal change.
