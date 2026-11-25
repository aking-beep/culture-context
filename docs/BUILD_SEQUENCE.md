# Factory build sequence

Each line is a separate factory station/spec.

1. `culture-mvp-brief` — traveler form -> GOV.UK adapter -> sourced brief.
2. `culture-source-snapshots` — persist retrievals and SHA-256 snapshots.
3. `culture-change-detector` — section-level diff and material change queue.
4. `culture-country-metadata` — normalized country/currency/language reference adapter.
5. `culture-live-disruption` — GDACS + ReliefWeb cards separated from legal cards.
6. `culture-ai-explain` — optional explanation endpoint through `@ark/runtime`.
7. `culture-trip-save` — accounts and saved traveler/trip profiles.
8. `culture-change-subscriptions` — notify only when subscribed trip facts materially change.
9. `culture-home-v-destination` — compare norms without stereotyping or converting norms into universal claims.
10. `culture-launch-country-01` through `05` — direct first-party source adapters per destination.
11. `culture-pwa` — offline cached brief and installability.
12. `culture-mobile` — native wrapper only if mobile usage justifies it.

Do not parallelize source adapters until the normalized record and change schemas are stable.
