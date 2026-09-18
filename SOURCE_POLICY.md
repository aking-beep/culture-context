# Source and trust policy

Culture Context is useful only if it is more disciplined than a generic chatbot.

## Provenance ladder

1. **Primary law/regulation** — destination government legislation, gazette, regulator rule, official local ordinance.
2. **Regulator guidance** — destination authority explaining its own rule.
3. **Government advisory** — another government's travel advice. Useful and official, but not the destination's legal text.
4. **Intergovernmental alert** — UN/EU/international hazard or humanitarian source.
5. **Reference data** — country, currency, weather, holiday, geography.
6. **Community context** — local reporting, organizations, or community observations. Never rendered as law.

## User-facing requirements

Every legal/restriction card must show:
- source authority
- source class
- canonical link
- last retrieved/verified time
- jurisdiction
- status when applicability is uncertain

The app should say `We could not verify this` instead of filling a gap with model knowledge.

## Source snapshots

Persist normalized text and SHA-256 for every retrieval. A new hash creates a change candidate. Do not overwrite history.

## HTML and content safety

Third-party HTML is untrusted input. Strip scripts/styles and render plain text or sanitized markup only. Never execute source HTML.

## Legal positioning

The product provides sourced travel information, not legal advice or an admission/visa decision. For high-consequence actions, send the user to the cited authority.
