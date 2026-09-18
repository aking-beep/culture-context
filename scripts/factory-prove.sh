#!/usr/bin/env bash
set -euo pipefail
SLUG="${1:-}"; PHASE="${2:-}"; [[ "$PHASE" =~ ^(before|after)$ ]] || { echo "usage: bash scripts/factory-prove.sh <slug> before|after" >&2; exit 2; }
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"; WT="worktrees/$SLUG"; DIR="evidence/$SLUG"; mkdir -p "$DIR"
if [[ -d "$WT" ]]; then SHA=$(git -C "$WT" rev-parse --short HEAD); DIRTY=$(git -C "$WT" status --porcelain | wc -l | tr -d ' '); else SHA=$(git rev-parse --short HEAD); DIRTY=$(git status --porcelain | wc -l | tr -d ' '); fi
STAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ"); [[ "$PHASE" != before || "$DIRTY" == 0 ]] || echo "WARNING: dirty station at before capture" >&2
printf '%s\t%s\t%s\tdirty=%s\n' "$PHASE" "$STAMP" "$SHA" "$DIRTY" >> "$DIR/captures.tsv"
[[ -f "$DIR/EVIDENCE.md" ]] || sed "s/<slug>/$SLUG/g" templates/EVIDENCE.md > "$DIR/EVIDENCE.md"
echo "$PHASE stamped: $SHA $STAMP. Add evidence/$SLUG/${PHASE}.txt|png|json"
