# Security and trust model

Culture Context is a high-trust information product. Treat all external source content, model output, user profile data, webhooks, and admin actions as untrusted input.

Core controls:

- Do not put passport numbers or travel document images into the MVP traveler profile.
- Do not log full personal profiles unless required for an explicit feature.
- Source fetches have bounded timeouts and fail closed to an unavailable state.
- Model output cannot directly publish a rule.
- Admin publishing will require authenticated authorization and audit history.
- Primary legal records must preserve authority, jurisdiction, source class, URL, retrieval time, and version/hash.
- Secrets live only in environment/secret managers.
- App-store analytics and crash tools must be documented in the privacy policy before release.
