#!/usr/bin/env bash
set -euo pipefail
SLUG="${1:-}"; [[ -n "$SLUG" ]] || { echo "usage: bash scripts/factory-ship.sh <slug>" >&2; exit 2; }
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"; BASE="${FACTORY_BASE_BRANCH:-main}"; WT="worktrees/$SLUG"
python3 scripts/factory-gate.py "$SLUG"
[[ -z "$(git status --porcelain)" ]] || { echo "main checkout must be clean" >&2; exit 1; }
git checkout "$BASE"; git add "evidence/$SLUG" "specs/$SLUG.md"; git commit -m "evidence: $SLUG" || true; git merge --no-ff "$SLUG" -m "merge: $SLUG"; git worktree remove "$WT" --force; git branch -d "$SLUG"; echo "shipped: $SLUG"
