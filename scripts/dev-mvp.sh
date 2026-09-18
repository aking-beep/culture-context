#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
trap 'kill 0' EXIT
npm run dev:api &
npm run dev:web &
wait
