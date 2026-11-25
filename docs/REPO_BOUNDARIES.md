# Repository boundaries

Culture Context is an independent product repository.

It may reuse **patterns** from ARK: provider abstraction, privacy-aware routing, evaluation discipline, telemetry concepts, and the software factory. It does not import ARK product-domain code by default.

If Culture Context later becomes the second real external consumer of ARK Runtime, that is the correct time to extract and publish stable reusable runtime packages. Until then, keep the boundary explicit and avoid git-submodule or source-copy coupling.
