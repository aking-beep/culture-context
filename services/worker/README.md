# Worker service

The worker will compare source versions, create review jobs for material changes, determine which saved trips are affected, and enqueue notifications. The MVP deliberately stops at deterministic hash comparison; publishing a legal change will require human review.
