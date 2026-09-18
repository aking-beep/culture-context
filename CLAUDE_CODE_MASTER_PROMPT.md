# Claude Code master prompt

Operate Culture Context through ARK's existing software factory.

Read `.claude/skills/software-factory/SKILL.md`, then the factory contract and the Culture Context spec. Use one worktree per feature. Capture before evidence before the first edit. Do not review your own work in the same context.

Architecture invariants:
- Next.js is presentation/edge only.
- Python service owns source adapters, normalization, applicability, and brief generation.
- Third-party APIs exist only in source adapter modules.
- Legal truth is provenance-first: `source -> record -> applicability -> output`.
- Model output is commentary, never authority.
- A missing source produces an unavailable state, not a guessed answer.
- Unknown applicability must stay unknown.

For each feature, produce tests and a one-sentence user capability statement before moving to PROVE.
