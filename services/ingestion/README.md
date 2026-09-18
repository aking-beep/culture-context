# Ingestion service

Retrieves official/approved source material, normalizes it deterministically, hashes the normalized representation, and writes a source snapshot. It does not ask a model whether a law exists.

MVP command:

```bash
CULTURE_INGEST_SLUG=japan npm run ingest:govuk
```

The next milestone is persistence plus a source-adapter contract for destination primary-law and regulator sources.
