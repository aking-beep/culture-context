# Source governance

A source adapter answers five questions: who is the authority, what jurisdiction does it cover, what class of evidence is it, when was it retrieved, and what exact version/hash produced the normalized record?

Publication policy:

- Primary law/regulator guidance: preferred for legal claims.
- Government advisory: useful traveler interpretation, always labeled as advisory.
- Intergovernmental alert: event/risk context, not destination law.
- Reference data: metadata only unless explicitly authoritative for the field.
- Community context: may inform cultural/local-impact context but cannot establish a legal requirement.

A source change creates a review candidate. Hash change is detection, not proof that the legal meaning changed. Material legal changes require human verification before a push notification states a new requirement.
