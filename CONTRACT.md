# The factory contract

This factory is ported from `aking-beep/ark`. It is a workflow, not a model-specific prompt.

| Step | Action | Failure prevented |
|---|---|---|
| **1. Isolate** | One feature per fresh worktree/branch. | Agents clobbering one another. |
| **2. Build** | Edge → service → adapter; deterministic logic first. | Unreadable agent-shaped code. |
| **3. Prove** | Record comparable before/after evidence. | Unsupported “it works” claims. |
| **4. Ship** | Independent reviewer; 5/5 gate before merge. | Author approving the author's work. |

Four invariants:

1. One feature, one worktree, one builder context.
2. No step is skipped and order is fixed.
3. Reviewer and builder are different contexts.
4. A score below 5 is fixed, not negotiated.

Durable artifacts are `specs/<slug>.md` and `evidence/<slug>/`. Worktrees are disposable.
