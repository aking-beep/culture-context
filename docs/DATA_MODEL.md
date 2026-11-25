# Data model

## TravelerProfile

- nationality (ISO-2)
- residence_country (ISO-2, optional)
- destination_country (ISO-2)
- destination_slug (source-specific canonical slug)
- city (optional)
- start_date / end_date (optional)
- purpose: tourism, remote_work, business, study, other
- activities: driving, medication, drone, filming, nightlife, hiking, climbing, surfing, camping, etc.

## SourceRef

- id
- authority
- url
- jurisdiction
- source_class
- retrieved_at
- published_at / updated_at when available
- content_hash

`source_class` is one of:

- `primary_law`
- `regulator_guidance`
- `government_advisory`
- `intergovernmental_alert`
- `reference_data`
- `community_context`

## RuleRecord

- id
- jurisdiction
- category
- kind
- title
- summary
- full_text (optional)
- applicability tags
- effective_from / effective_to
- verification status
- sources[]

Kinds:
- law
- restriction
- advisory
- cultural_norm
- local_impact
- context

A `government_advisory` source may produce an `advisory` record directly. It must not automatically produce a `law` record. Promotion to `law` requires a primary-law or regulator source and verification.

## ChangeRecord

- source_id
- previous_hash
- current_hash
- detected_at
- materiality
- affected_rule_ids
- reviewed_at / reviewed_by

The first change detector should compare normalized source hashes and section text. AI may help summarize a diff for a human, but it does not decide whether the legal meaning changed.
