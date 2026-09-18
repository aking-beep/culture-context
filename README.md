# Culture Context

Provenance-first travel context. The product answers a different question than booking or safety apps:

> Tell me what I do not know I need to know about being here.

This MVP builds a destination brief from cited source records. It does not invent laws, approve visas, or upgrade a government advisory into primary law.

## What is in the MVP

- Traveler profile: nationality, residence, destination, city, dates, purpose, activities
- FastAPI service with GOV.UK foreign-travel-advice as the first official advisory source
- REST Countries metadata and optional home-vs-destination comparison (reference data only)
- Optional FX reference, GDACS, and ReliefWeb cards, labeled as reference or intergovernmental alerts
- Deterministic applicability ranking and activity matching
- Source snapshots (SHA-256) and unreviewed hash-change candidates
- Next.js mobile-first traveler app at `apps/web` (port 3010)
- Admin source-health console at `apps/admin` (port 3011)
- Expo mobile scaffold at `apps/mobile`
- Optional `/v1/explain` restatement endpoint, **disabled by default**

## Run locally

```bash
python3 -m pip install -e "services/api[dev]" -e "services/ingestion[dev]" -e "services/worker[dev]"
npm install

# terminal 1
npm run dev:api

# terminal 2
npm run dev:web

# optional
npm run dev:admin
```

Open [http://localhost:3010](http://localhost:3010). The API listens on [http://127.0.0.1:8580/health](http://127.0.0.1:8580/health).

```bash
npm test
npm run typecheck
CULTURE_INGEST_SLUG=japan npm run ingest:govuk
```

API-only Docker:

```bash
docker compose -f infrastructure/docker-compose.yml up --build
```

## Rules the code enforces

- A user-facing legal/restriction card must include a source record
- `government_advisory` never becomes `primary_law`
- If a source is down, the brief still returns, with an unavailable status and no invented facts
- AI explanation is a labeled restatement of supplied records, and can be turned off entirely

Launch destinations in this slice: Japan, Mexico, France, Thailand, Morocco.
