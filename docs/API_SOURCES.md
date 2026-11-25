# Initial source map

These are adapters, not equivalent authorities.

| Source | Product use | Trust class | MVP? |
|---|---|---|---|
| GOV.UK Content API | structured travel advice sections | government_advisory | yes |
| U.S. State Department RSS/pages | advisory changes and U.S.-traveler context | government_advisory | phase 2 |
| GDACS API | earthquake, cyclone, flood and disaster alerts | intergovernmental_alert | phase 2 |
| ReliefWeb API v2 | humanitarian/disruption context | intergovernmental_alert/context | phase 2 |
| REST Countries v5 | ISO/currency/language/country metadata | reference_data | phase 2 |
| Frankfurter v2 | FX reference data | reference_data | phase 2 |
| Open-Meteo | weather/environment context | reference_data | phase 2 |
| Destination authority adapters | actual law/regulator rules | primary_law / regulator_guidance | required before claiming deep country coverage |

## Why the source registry matters

There is no trustworthy universal open API for all tourist laws. Launch quality therefore comes from having excellent adapters for a small number of destinations, not shallow coverage of 200 countries.

Start with five launch destinations and build first-party source manifests for each.
