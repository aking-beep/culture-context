#!/usr/bin/env bash
set -euo pipefail
SLUG="${1:-}"; [[ "$SLUG" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || { echo "usage: bash scripts/factory-new.sh <kebab-slug>" >&2; exit 2; }
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"; BASE="${FACTORY_BASE_BRANCH:-main}"; WT="worktrees/$SLUG"
[[ ! -e "$WT" ]] || { echo "station exists: $WT" >&2; exit 1; }
if git remote get-url origin >/dev/null 2>&1; then git fetch origin "$BASE"; START="origin/$BASE"; else START="$BASE"; fi
git worktree add -b "$SLUG" "$WT" "$START"
mkdir -p "evidence/$SLUG" specs
[[ -f "specs/$SLUG.md" ]] || sed "s/<slug>/$SLUG/g" templates/FEATURE.md > "specs/$SLUG.md"
N=$(git worktree list --porcelain | grep -c '^worktree ' || true); PORT=$((3000 + N - 1)); echo "PORT=$PORT" > "$WT/.factory-station"
echo "station ready: $WT · port $PORT · spec specs/$SLUG.md"
